"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/service/AuthService';
import {
  deleteActivity,
  getActivityById,
  getMyCreatedActivities,
  getMyJoinedActivities,
  joinActivity,
  leaveActivity,
  toggleActivityBookmark,
  toggleActivityLike,
  updateActivity,
  type Activity,
  type ActivityPayload,
} from '@/service/activityService';
import { getCurrentUserBookmarks } from '@/service/userService';
import { getDashboardActivities } from '@/service/dashboardService';
import { useAuth } from '@/src/components/auth/AuthProvider';
import { ActivityDetailModal, type ActivityDetailData } from '@/src/components/activity/ActivityDetailModal';
import { JoinedActivityCard } from './JoinedActivityCard';
import { MyActivityCard } from '@/src/components/activity/MyActivityCard';
import { StatCard } from '@/src/components/dashboard/StatCard';
import { EditActivityModal, type EditPlanData } from '@/src/components/plan/EditActivityModal';
import { useDashboardContext } from '@/src/components/dashboard/AppShell';
import { toActivityDetail, toMyActivity } from './activityMappers';
import { confirmAction } from '@/src/lib/confirmAction';

export default function MyActivitiesPage() {
  const { categories, currentUserId } = useDashboardContext();
  const { notify } = useAuth();
  const [hostedActivities, setHostedActivities] = useState<Activity[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [pastActivities, setPastActivities] = useState<Activity[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [activeActivityList, setActiveActivityList] = useState<'hosted' | 'joined'>('hosted');
  const [activityToEdit, setActivityToEdit] = useState<EditPlanData | null>(null);
  const [activityToView, setActivityToView] = useState<ActivityDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const showApiError = useCallback((error: unknown, fallback: string) => {
    if (!(error instanceof ApiError && error.status === 401)) {
      notify(error instanceof Error ? error.message : fallback, 'error');
    }
  }, [notify]);

  const refreshLists = useCallback(async () => {
    try {
      const [created, joined, upcoming, past, bookmarks] = await Promise.all([
        getMyCreatedActivities(),
        getMyJoinedActivities(),
        getDashboardActivities('upcoming'),
        getDashboardActivities('past'),
        getCurrentUserBookmarks(),
      ]);
      setHostedActivities(created);
      setJoinedActivities(joined);
      setUpcomingActivities(upcoming);
      setPastActivities(past);
      setBookmarkedIds(new Set(bookmarks.map((activity) => activity.id)));
      setLikedIds(new Set(bookmarks.filter((activity) => activity.is_liked).map((activity) => activity.id)));
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load your activities.');
      showApiError(error, 'Unable to load your activities.');
    } finally {
      setIsLoading(false);
    }
  }, [showApiError]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refreshLists(), 0);
    const handleUpdate = () => void refreshLists();
    window.addEventListener('app:activities-updated', handleUpdate);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener('app:activities-updated', handleUpdate);
    };
  }, [refreshLists]);

  const joinedIds = useMemo(
    () => new Set(joinedActivities.map((activity) => activity.id)),
    [joinedActivities],
  );
  const upcomingHosted = upcomingActivities.filter((activity) => activity.host_id === currentUserId);
  const upcomingJoined = upcomingActivities.filter((activity) => joinedIds.has(activity.id));

  const handleEdit = (id: string) => {
    const activity = hostedActivities.find((item) => item.id === id);
    if (!activity) return;
    setActivityToEdit({
      id: activity.id,
      title: activity.title,
      categoryId: activity.category_id,
      environment: activity.environment === 'indoor' ? 'Indoor' : 'Outdoor',
      description: activity.description,
      location: activity.location,
      date: activity.activity_date,
      startTime: activity.start_time.slice(0, 5),
      endTime: activity.end_time.slice(0, 5),
      additionalParticipants: activity.additional_needed,
      coverImage: activity.cover_image_url ?? '',
    });
  };

  const handleSave = async (updatedPlan: EditPlanData) => {
    const payload: ActivityPayload = {
      category_id: updatedPlan.categoryId,
      title: updatedPlan.title,
      description: updatedPlan.description,
      cover_image_url: updatedPlan.coverImage || null,
      location: updatedPlan.location,
      activity_date: updatedPlan.date,
      start_time: updatedPlan.startTime,
      end_time: updatedPlan.endTime,
      environment: updatedPlan.environment === 'Indoor' ? 'indoor' : 'outdoor',
      additional_needed: updatedPlan.additionalParticipants,
    };
    try {
      await updateActivity(updatedPlan.id, payload);
      notify('Activity updated successfully.', 'success');
      await refreshLists();
      window.dispatchEvent(new Event('app:dashboard-refresh'));
    } catch (error) {
      showApiError(error, 'Unable to update activity.');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction({
      title: 'Delete this activity?',
      text: 'This action cannot be undone.',
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    });
    if (!confirmed) return;

    try {
      await deleteActivity(id);
      notify('Activity deleted successfully.', 'success');
      await refreshLists();
      window.dispatchEvent(new Event('app:dashboard-refresh'));
    } catch (error) {
      showApiError(error, 'Unable to delete activity.');
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const activity = await getActivityById(id);
      setActivityToView(toActivityDetail(activity, {
        isJoined: joinedIds.has(id),
        isBookmarked: bookmarkedIds.has(id),
        isLiked: likedIds.has(id) || activity.is_liked === true,
        canJoin: activity.host_id !== currentUserId,
      }));
    } catch (error) {
      showApiError(error, 'Unable to load activity details.');
    }
  };

  const handleJoinToggle = async (isJoined: boolean) => {
    if (!activityToView) return false;
    if (isJoined) await joinActivity(activityToView.id);
    else await leaveActivity(activityToView.id);
    await refreshLists();
    window.dispatchEvent(new Event('app:dashboard-refresh'));
    return isJoined;
  };

  const handleBookmarkToggle = async () => {
    if (!activityToView) return false;
    const state = await toggleActivityBookmark(activityToView.id);
    setBookmarkedIds((current) => {
      const next = new Set(current);
      if (state.is_bookmarked) next.add(activityToView.id);
      else next.delete(activityToView.id);
      return next;
    });
    setLikedIds((current) => {
      const next = new Set(current);
      if (state.is_liked) next.add(activityToView.id);
      else next.delete(activityToView.id);
      return next;
    });
    return state.is_bookmarked;
  };

  const handleLikeToggle = async () => {
    if (!activityToView) return false;
    const state = await toggleActivityLike(activityToView.id);
    setLikedIds((current) => {
      const next = new Set(current);
      if (state.is_liked) next.add(activityToView.id);
      else next.delete(activityToView.id);
      return next;
    });
    setBookmarkedIds((current) => {
      const next = new Set(current);
      if (state.is_bookmarked) next.add(activityToView.id);
      else next.delete(activityToView.id);
      return next;
    });
    return state.is_liked;
  };

  const renderActivityState = (activities: Activity[], emptyText: string) => {
    if (isLoading) {
      return <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500" role="status">Loading activities…</p>;
    }
    if (loadError) {
      return (
        <div className="rounded-2xl bg-white p-5 text-sm text-neutral-500">
          <p>{loadError}</p>
          <button type="button" onClick={() => { setIsLoading(true); void refreshLists(); }} className="mt-2 font-bold text-orange-600">Try again</button>
        </div>
      );
    }
    if (activities.length === 0) {
      return <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500">{emptyText}</p>;
    }
    return activities.map((activity) => (
      <JoinedActivityCard
        key={activity.id}
        activity={toMyActivity(activity)}
        onClick={handleViewDetails}
      />
    ));
  };

  return (
    <>
      <section className="space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Your plans</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Activity Hub</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage the plans you host and the activities you join.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Hosted Plans"
            count={hostedActivities.length}
            isHighlighted
            isSelected={activeActivityList === 'hosted'}
            onClick={() => setActiveActivityList('hosted')}
          />
          <StatCard
            label="Joined Plans"
            count={joinedActivities.length}
            isSelected={activeActivityList === 'joined'}
            onClick={() => setActiveActivityList('joined')}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-900">Upcoming Activities</h2>
          {activeActivityList === 'hosted' ? (
            <section aria-labelledby="hosted-activities-heading" className="space-y-3">
              <h3 id="hosted-activities-heading" className="text-sm font-semibold text-neutral-700">Hosted Activities</h3>
              {isLoading ? (
                <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500" role="status">Loading activities…</p>
              ) : loadError ? (
                <div className="rounded-2xl bg-white p-5 text-sm text-neutral-500">
                  <p>{loadError}</p>
                  <button type="button" onClick={() => { setIsLoading(true); void refreshLists(); }} className="mt-2 font-bold text-orange-600">Try again</button>
                </div>
              ) : upcomingHosted.length > 0 ? upcomingHosted.map((activity) => (
                <MyActivityCard
                  key={activity.id}
                  activity={toMyActivity(activity)}
                  onEdit={handleEdit}
                  onDelete={(id) => void handleDelete(id)}
                />
              )) : (
                <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500">You have no upcoming hosted activities.</p>
              )}
            </section>
          ) : (
            <section aria-labelledby="joined-activities-heading" className="space-y-3">
              <h3 id="joined-activities-heading" className="text-sm font-semibold text-neutral-700">Joined Activities</h3>
              {renderActivityState(
                upcomingJoined,
                'You have not joined any upcoming activities yet.',
              )}
            </section>
          )}
        </div>

        <section aria-labelledby="past-activities-heading" className="space-y-3">
          <h2 id="past-activities-heading" className="text-sm font-bold text-neutral-900">Past Activities</h2>
          {renderActivityState(pastActivities, 'No past activities yet.')}
        </section>
      </section>
      <EditActivityModal
        key={activityToEdit?.id ?? 'closed'}
        isOpen={activityToEdit !== null}
        initialData={activityToEdit}
        categories={categories}
        onClose={() => setActivityToEdit(null)}
        onSave={handleSave}
      />
      <ActivityDetailModal
        key={activityToView?.id ?? 'closed-detail'}
        isOpen={activityToView !== null}
        activity={activityToView}
        onClose={() => setActivityToView(null)}
        onJoinToggle={handleJoinToggle}
        onBookmarkChange={handleBookmarkToggle}
        onLikeChange={handleLikeToggle}
      />
    </>
  );
}
