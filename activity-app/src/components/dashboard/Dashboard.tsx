"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/service/AuthService';
import {
  getActivities,
  getActivityById,
  getMyJoinedActivities,
  joinActivity,
  leaveActivity,
  toggleActivityBookmark,
  toggleActivityLike,
  type ActivityFeedFilter,
  type Activity,
  type ActivityFilters,
} from '@/service/activityService';
import { getCurrentUserBookmarks } from '@/service/userService';
import { useAuth } from '../auth/AuthProvider';
import { ActivityCard } from '../activity/ActivityCard';
import { ActivityDetailModal, type ActivityDetailData } from '../activity/ActivityDetailModal';
import { toActivityDetail, toActivityPlan } from '../activity/activityMappers';
import { useDashboardContext, useOpenHostPlanModal } from './AppShell';
import { FeedHeader } from './FeedHeader';
import { SidebarRight } from './SidebarRight';

export default function Dashboard() {
  const openHostPlanModal = useOpenHostPlanModal();
  const {
    categories,
    currentUserId,
    searchQuery,
    nearbyLocation,
    locationLoading,
    locationError,
  } = useDashboardContext();
  const { notify } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilterType, setSelectedFilterType] = useState<ActivityFeedFilter>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const feedRequestId = useRef(0);
  const previousFilterType = useRef(selectedFilterType);

  const categoryId = categories.find((category) => category.name === selectedCategory)?.id;
  const showApiError = useCallback((error: unknown, fallback: string) => {
    if (!(error instanceof ApiError && error.status === 401)) {
      notify(error instanceof Error ? error.message : fallback, 'error');
    }
  }, [notify]);

  const refreshActivities = useCallback(async () => {
    const requestId = ++feedRequestId.current;
    setLoading(true);
    setLoadError('');
    if (locationLoading) return;
    if (!nearbyLocation) {
      setActivities([]);
      setLoadError(locationError || 'Choose a location to discover nearby activities.');
      setLoading(false);
      return;
    }
    const filters: ActivityFilters = {
      search: searchQuery.trim() || undefined,
      category_id: categoryId,
      environment: selectedFilterType === 'indoor' || selectedFilterType === 'outdoor'
        ? selectedFilterType
        : undefined,
      posted_by_buddies: selectedFilterType === 'buddies' ? true : undefined,
      near_latitude: nearbyLocation.latitude,
      near_longitude: nearbyLocation.longitude,
      radius_km: 25,
      limit: 100,
    };
    try {
      const [results, joined, bookmarks] = await Promise.all([
        getActivities(filters),
        getMyJoinedActivities(),
        getCurrentUserBookmarks(),
      ]);
      if (requestId !== feedRequestId.current) return;
      const bookmarkedById = new Map(bookmarks.map((activity) => [activity.id, activity]));
      setActivities(results.map((activity) => {
        const bookmarked = bookmarkedById.get(activity.id);
        return {
          ...activity,
          is_liked: activity.is_liked ?? bookmarked?.is_liked,
          is_bookmarked: activity.is_bookmarked ?? bookmarked?.is_bookmarked,
        };
      }));
      setJoinedIds(new Set(joined.map((activity) => activity.id)));
      setBookmarkedIds(new Set(bookmarks.map((activity) => activity.id)));
    } catch (error) {
      if (requestId !== feedRequestId.current) return;
      setLoadError(error instanceof Error ? error.message : 'Unable to load activities.');
      showApiError(error, 'Unable to load activities.');
    } finally {
      if (requestId === feedRequestId.current) setLoading(false);
    }
  }, [
    categoryId,
    locationError,
    locationLoading,
    nearbyLocation,
    searchQuery,
    selectedFilterType,
    showApiError,
  ]);

  useEffect(() => {
    const filterChanged = previousFilterType.current !== selectedFilterType;
    previousFilterType.current = selectedFilterType;
    const timer = filterChanged
      ? undefined
      : window.setTimeout(() => void refreshActivities(), 250);
    if (filterChanged) void refreshActivities();
    const handleActivitiesUpdated = () => void refreshActivities();
    window.addEventListener('app:activities-updated', handleActivitiesUpdated);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener('app:activities-updated', handleActivitiesUpdated);
    };
  }, [refreshActivities, selectedFilterType]);

  const plans = useMemo(
    () => activities.map((activity) => ({
      ...toActivityPlan(activity),
      isJoined: joinedIds.has(activity.id),
      isJoining: joiningId === activity.id,
      canJoin: currentUserId === null ? undefined : activity.host_id !== currentUserId,
    })),
    [activities, currentUserId, joinedIds, joiningId],
  );

  const updateActionActivity = (updated: Activity) => {
    setActivities((current) => current.map((activity) => (
      activity.id === updated.id ? updated : activity
    )));
  };

  const handleJoin = async (activityId: string) => {
    const isJoined = joinedIds.has(activityId);
    setJoiningId(activityId);
    try {
      const updated = isJoined
        ? await leaveActivity(activityId)
        : await joinActivity(activityId);
      updateActionActivity(updated);
      setJoinedIds((current) => {
        const next = new Set(current);
        if (isJoined) next.delete(activityId);
        else next.add(activityId);
        return next;
      });
      notify(isJoined ? 'You left this activity.' : 'You joined this activity.', 'success');
      window.dispatchEvent(new Event('app:dashboard-refresh'));
    } catch (error) {
      showApiError(error, 'Unable to update activity membership.');
    } finally {
      setJoiningId(null);
    }
  };

  const openDetails = async (activity: Activity) => {
    const state = {
      isJoined: joinedIds.has(activity.id),
      isBookmarked: bookmarkedIds.has(activity.id),
      isLiked: activity.is_liked ?? false,
      canJoin: currentUserId === null ? undefined : activity.host_id !== currentUserId,
    };
    setSelectedActivity(toActivityDetail(activity, state));
    try {
      const details = await getActivityById(activity.id);
      setSelectedActivity((current) => current?.id === details.id
        ? toActivityDetail(details, state)
        : current);
    } catch (error) {
      showApiError(error, 'Unable to load activity details.');
    }
  };

  const handleJoinToggle = async (isJoined: boolean) => {
    if (!selectedActivity) return false;
    const activityId = selectedActivity.id;
    const updated = isJoined
      ? await joinActivity(activityId)
      : await leaveActivity(activityId);
    updateActionActivity(updated);
    setJoinedIds((current) => {
      const next = new Set(current);
      if (isJoined) next.add(activityId);
      else next.delete(activityId);
      return next;
    });
    setSelectedActivity((current) => current
      ? toActivityDetail(updated, {
        isJoined,
        isBookmarked: current.isBookmarked ?? false,
        isLiked: current.isLiked ?? false,
        canJoin: current.canJoin,
      })
      : current);
    window.dispatchEvent(new Event('app:dashboard-refresh'));
    return isJoined;
  };

  const handleBookmarkToggle = async () => {
    if (!selectedActivity) return;
    const activityId = selectedActivity.id;
    const state = await toggleActivityBookmark(activityId);
    setBookmarkedIds((current) => {
      const next = new Set(current);
      if (state.is_bookmarked) next.add(activityId);
      else next.delete(activityId);
      return next;
    });
    setActivities((current) => current.map((activity) => activity.id === activityId
      ? { ...activity, is_liked: state.is_liked, is_bookmarked: state.is_bookmarked, likes_count: state.likes_count }
      : activity));
    setSelectedActivity((current) => current
      ? { ...current, isBookmarked: state.is_bookmarked, isLiked: state.is_liked }
      : current);
    return state.is_bookmarked;
  };

  const handleLikeToggle = async () => {
    if (!selectedActivity) return false;
    const activityId = selectedActivity.id;
    const state = await toggleActivityLike(activityId);
    setActivities((current) => current.map((activity) => activity.id === activityId
      ? { ...activity, is_liked: state.is_liked, is_bookmarked: state.is_bookmarked, likes_count: state.likes_count }
      : activity));
    setSelectedActivity((current) => current
      ? { ...current, isLiked: state.is_liked, isBookmarked: state.is_bookmarked }
      : current);
    return state.is_liked;
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <section className="space-y-6 xl:col-span-2">
        <FeedHeader
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedFilterType={selectedFilterType}
          onSelectFilterType={setSelectedFilterType}
          locationLabel={nearbyLocation?.label}
          radiusKm={25}
          showingCount={plans.length}
          totalCount={plans.length}
          categories={categories}
        />

        <div className="space-y-5">
          {loading ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-12 text-center" role="status">
              <p className="text-sm font-semibold text-neutral-500">Loading activities…</p>
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-neutral-500">{loadError}</p>
              <button type="button" onClick={() => void refreshActivities()} className="mt-3 text-sm font-bold text-orange-600">
                Try again
              </button>
            </div>
          ) : plans.length > 0 ? (
            plans.map((plan) => (
              <ActivityCard
                key={plan.id}
                plan={plan}
                onJoin={(id) => void handleJoin(id)}
                onCardClick={() => {
                  const activity = activities.find((item) => item.id === plan.id);
                  if (activity) void openDetails(activity);
                }}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-neutral-500">
                No activities found within 25 km for this filter.
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                Activities without a mapped meeting location are not included in nearby results.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="xl:col-span-1">
        <SidebarRight circles={[]} onCreateInstantPlan={openHostPlanModal} />
      </div>
      <ActivityDetailModal
        key={selectedActivity?.id ?? 'closed'}
        isOpen={selectedActivity !== null}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onLikeChange={handleLikeToggle}
        onBookmarkChange={handleBookmarkToggle}
        onJoinToggle={handleJoinToggle}
      />
    </div>
  );
}
