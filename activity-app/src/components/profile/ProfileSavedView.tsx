"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { ApiError } from '@/service/AuthService';
import {
  getActivityById,
  getMyJoinedActivities,
  joinActivity,
  leaveActivity,
  toggleActivityBookmark,
  toggleActivityLike,
  type Activity,
} from '@/service/activityService';
import {
  getCurrentUserBookmarks,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  type UserProfile,
} from '@/service/userService';
import { useAuth } from '../auth/AuthProvider';
import { ActivityDetailModal, type ActivityDetailData } from '../activity/ActivityDetailModal';
import { toActivityDetail, toBookmarkedActivity } from '../activity/activityMappers';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { BookmarkedCard } from './BookmarkedCard';
import { EditProfileForm, type ProfileFormData } from './EditProfileForm';
import { confirmAction } from '@/src/lib/confirmAction';

function toProfileFormData(profile: UserProfile): ProfileFormData {
  return {
    fullName: profile.full_name,
    email: profile.email,
    location: profile.location ?? '',
    bio: profile.bio ?? '',
  };
}

export function ProfileSavedView() {
  const { notify } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<Activity[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetailData | null>(null);

  const showApiError = useCallback((error: unknown, fallback: string) => {
    if (!(error instanceof ApiError && error.status === 401)) {
      notify(error instanceof Error ? error.message : fallback, 'error');
    }
  }, [notify]);

  const refreshProfileAndBookmarks = useCallback(async () => {
    try {
      const [currentProfile, currentBookmarks, joined] = await Promise.all([
        getCurrentUserProfile(),
        getCurrentUserBookmarks(),
        getMyJoinedActivities(),
      ]);
      setProfile(currentProfile);
      setBookmarks(currentBookmarks);
      setJoinedIds(new Set(joined.map((activity) => activity.id)));
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load your profile.');
      showApiError(error, 'Unable to load your profile.');
    } finally {
      setIsLoading(false);
    }
  }, [showApiError]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refreshProfileAndBookmarks(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [refreshProfileAndBookmarks]);

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((activity) => activity.id)),
    [bookmarks],
  );

  const handleSaveProfile = async (form: ProfileFormData) => {
    setIsSaving(true);
    try {
      const updatedProfile = await updateCurrentUserProfile({
        full_name: form.fullName.trim(),
        location: form.location.trim() || null,
        bio: form.bio.trim() || null,
      });
      setProfile(updatedProfile);
      setIsEditingProfile(false);
      notify('Profile updated successfully.', 'success');
      window.dispatchEvent(new Event('app:profile-refresh'));
    } catch (error) {
      showApiError(error, 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProfile = async () => {
    if (isEditingProfile) {
      setIsEditingProfile(false);
      return;
    }

    const confirmed = await confirmAction({
      title: 'Edit your profile?',
      text: 'You can update your profile details in the form.',
      confirmButtonText: 'Continue',
    });
    if (confirmed) setIsEditingProfile(true);
  };

  const handleBookmarkToggle = async (activityId: string) => {
    try {
      const state = await toggleActivityBookmark(activityId);
      if (!state.is_bookmarked) {
        setBookmarks((current) => current.filter((activity) => activity.id !== activityId));
      }
      notify(
        state.is_bookmarked ? 'Activity bookmarked successfully.' : 'Activity removed from bookmarks.',
        'success',
      );
    } catch (error) {
      showApiError(error, 'Unable to update bookmark.');
    }
  };

  const handleOpenActivity = async (activityId: string) => {
    try {
      const activity = await getActivityById(activityId);
      const bookmark = bookmarks.find((item) => item.id === activityId);
      setSelectedActivity(toActivityDetail(activity, {
        isJoined: joinedIds.has(activityId),
        isBookmarked: bookmarkedIds.has(activityId),
        isLiked: bookmark?.is_liked ?? activity.is_liked ?? false,
        canJoin: activity.host_id !== profile?.id,
      }));
    } catch (error) {
      showApiError(error, 'Unable to load activity details.');
    }
  };

  const handleJoinToggle = async (isJoined: boolean) => {
    if (!selectedActivity) return false;
    if (isJoined) await joinActivity(selectedActivity.id);
    else await leaveActivity(selectedActivity.id);
    setJoinedIds((current) => {
      const next = new Set(current);
      if (isJoined) next.add(selectedActivity.id);
      else next.delete(selectedActivity.id);
      return next;
    });
    window.dispatchEvent(new Event('app:dashboard-refresh'));
    return isJoined;
  };

  const handleModalBookmarkToggle = async () => {
    if (!selectedActivity) return false;
    const state = await toggleActivityBookmark(selectedActivity.id);
    if (state.is_bookmarked) {
      const activity = await getActivityById(selectedActivity.id);
      setBookmarks((current) => [
        { ...activity, is_bookmarked: true, is_liked: state.is_liked },
        ...current.filter((item) => item.id !== selectedActivity.id),
      ]);
    } else {
      setBookmarks((current) => current.filter((activity) => activity.id !== selectedActivity.id));
    }
    setBookmarks((current) => current.map((activity) => activity.id === selectedActivity.id
      ? { ...activity, is_liked: state.is_liked, is_bookmarked: state.is_bookmarked }
      : activity));
    return state.is_bookmarked;
  };

  const handleLikeToggle = async () => {
    if (!selectedActivity) return false;
    const state = await toggleActivityLike(selectedActivity.id);
    setBookmarks((current) => current.map((activity) => activity.id === selectedActivity.id
      ? { ...activity, is_liked: state.is_liked, is_bookmarked: state.is_bookmarked }
      : activity));
    return state.is_liked;
  };

  if (isLoading) {
    return <p className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-sm text-neutral-500" role="status">Loading profile and saved activities…</p>;
  }

  if (loadError || !profile) {
    return (
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-sm text-neutral-500">
        <p>{loadError || 'Your profile could not be loaded.'}</p>
        <button type="button" onClick={() => { setIsLoading(true); void refreshProfileAndBookmarks(); }} className="mt-3 font-bold text-orange-600">
          Try again
        </button>
      </div>
    );
  }

  const profileFormData = toProfileFormData(profile);

  return (
    <>
      <div className="w-full space-y-7 animate-in fade-in-50 duration-200">
        <ProfileHeaderCard
          name={profileFormData.fullName}
          location={profileFormData.location}
          email={profileFormData.email}
          bio={profileFormData.bio}
          onEditProfile={() => void handleEditProfile()}
        />

        {isEditingProfile && (
          <EditProfileForm
            key={profile.id}
            initialData={profileFormData}
            isSaving={isSaving}
            onSave={handleSaveProfile}
            onCancel={() => setIsEditingProfile(false)}
          />
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-orange-600" />
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
              Saved & Bookmarked Activities ({bookmarks.length})
            </h2>
          </div>
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarks.map((activity) => (
                <BookmarkedCard
                  key={activity.id}
                  activity={toBookmarkedActivity(activity)}
                  onBookmarkToggle={(id) => void handleBookmarkToggle(id)}
                  onClick={(id) => void handleOpenActivity(id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-white rounded-3xl border border-neutral-200/80">
              <p className="text-xs font-semibold text-neutral-400">
                No saved activities yet. Explore plans to bookmark activities!
              </p>
            </div>
          )}
        </div>
      </div>
      <ActivityDetailModal
        key={selectedActivity?.id ?? 'closed-profile-detail'}
        isOpen={selectedActivity !== null}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onJoinToggle={handleJoinToggle}
        onBookmarkChange={handleModalBookmarkToggle}
        onLikeChange={handleLikeToggle}
      />
    </>
  );
}
