"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiError } from '@/service/AuthService';
import {
  getProfileActivities,
  getPublicProfile,
  type ProfileActivityTab,
  type PublicProfile,
} from '@/service/profileService';
import {
  joinActivity,
  leaveActivity,
  type Activity,
} from '@/service/activityService';
import { useAuth } from '@/src/components/auth/AuthProvider';
import { ActivityCard } from '@/src/components/activity/ActivityCard';
import { toActivityPlan } from '@/src/components/activity/activityMappers';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { useDashboardContext } from '@/src/components/dashboard/AppShell';

const PAGE_SIZE = 10;

export function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const router = useRouter();
  const { notify } = useAuth();
  const { currentUserId } = useDashboardContext();
  const [profileResult, setProfileResult] = useState<{
    userId: string;
    profile?: PublicProfile;
    error?: string;
  } | null>(null);
  const [profileReload, setProfileReload] = useState(0);
  const [tab, setTab] = useState<ProfileActivityTab>('hosted');
  const [offset, setOffset] = useState(0);
  const [activityReload, setActivityReload] = useState(0);
  const [activityResult, setActivityResult] = useState<{
    key: string;
    items?: Activity[];
    total?: number;
    error?: string;
  } | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const activityRequestKey = `${userId}:${tab}:${offset}`;
  const profile = profileResult?.userId === userId
    ? profileResult.profile ?? null
    : null;
  const profileError = profileResult?.userId === userId
    ? profileResult.error ?? ''
    : '';
  const isLoadingProfile = profileResult?.userId !== userId;
  const activityResultIsCurrent = activityResult?.key === activityRequestKey;
  const activities = activityResultIsCurrent ? activityResult.items ?? [] : [];
  const activitiesTotal = activityResultIsCurrent ? activityResult.total ?? 0 : 0;
  const activitiesError = activityResultIsCurrent ? activityResult.error ?? '' : '';
  const isLoadingActivities = !activityResultIsCurrent;

  const showApiError = useCallback((error: unknown, fallback: string) => {
    if (!(error instanceof ApiError && error.status === 401)) {
      notify(error instanceof Error ? error.message : fallback, 'error');
    }
  }, [notify]);

  useEffect(() => {
    let cancelled = false;

    getPublicProfile(userId)
      .then((result) => {
        if (!cancelled) setProfileResult({ userId, profile: result });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProfileResult({
          userId,
          error: error instanceof Error
            ? error.message
            : 'Unable to load this profile.',
        });
        showApiError(error, 'Unable to load this profile.');
      });

    return () => {
      cancelled = true;
    };
  }, [profileReload, showApiError, userId]);

  useEffect(() => {
    let cancelled = false;

    getProfileActivities(userId, { tab, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (cancelled) return;
        setActivityResult({
          key: activityRequestKey,
          items: result.items,
          total: result.total,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setActivityResult({
          key: activityRequestKey,
          error: error instanceof Error
            ? error.message
            : 'Unable to load profile activities.',
        });
        showApiError(error, 'Unable to load profile activities.');
      });

    return () => {
      cancelled = true;
    };
  }, [activityReload, activityRequestKey, offset, showApiError, tab, userId]);

  const handleJoin = async (activityId: string) => {
    const activity = activities.find((item) => item.id === activityId);
    if (!activity) return;

    setJoiningId(activityId);
    try {
      const updated = activity.is_joined
        ? await leaveActivity(activityId)
        : await joinActivity(activityId);
      setActivityResult((current) => current?.key === activityRequestKey
        ? {
          ...current,
          items: current.items?.map((item) => (
            item.id === updated.id ? updated : item
          )),
        }
        : current);
      notify(
        activity.is_joined ? 'You left this activity.' : 'You joined this activity.',
        'success',
      );
      window.dispatchEvent(new Event('app:dashboard-refresh'));
    } catch (error) {
      showApiError(error, 'Unable to update activity membership.');
    } finally {
      setJoiningId(null);
    }
  };

  if (isLoadingProfile) {
    return (
      <p className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-sm text-neutral-500" role="status">
        Loading profile…
      </p>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-sm text-neutral-500">
        <p>{profileError || 'This profile could not be loaded.'}</p>
        <button
          type="button"
          onClick={() => setProfileReload((current) => current + 1)}
          className="mt-3 font-bold text-orange-600"
        >
          Try again
        </button>
      </div>
    );
  }

  const ownProfile = profile.is_own_profile || profile.id === currentUserId;

  return (
    <div className="w-full space-y-7 animate-in fade-in-50 duration-200">
      <ProfileHeaderCard
        name={profile.full_name}
        location={profile.location ?? 'Location not added'}
        avatarUrl={profile.avatar_url ?? ''}
        bio={profile.bio ?? 'No bio added yet.'}
        userId={profile.id}
        isOwnProfile={ownProfile}
        showEditButton={ownProfile}
        showAvatarUpload={ownProfile}
        showEmail={false}
        onEditProfile={() => router.push('/dashboard/profile')}
        onBuddyChange={(isBuddy) => {
          setProfileResult((current) => current?.profile
            ? {
              ...current,
              profile: {
                ...current.profile,
                is_buddy: isBuddy,
                followers_count: Math.max(
                  0,
                  current.profile.followers_count + (isBuddy ? 1 : -1),
                ),
              },
            }
            : current);
        }}
      />

      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
            {profile.hosted_count} hosted {profile.hosted_count === 1 ? 'activity' : 'activities'}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-900">
            {profile.full_name}&apos;s activities
          </h2>
        </div>

        <div className="flex gap-2 border-b border-neutral-200" role="tablist" aria-label="Profile activity tabs">
          {([
            ['hosted', 'Hosted Activities'],
            ['common', 'In Common'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`profile-tab-${value}`}
              aria-selected={tab === value}
              aria-controls="profile-activity-panel"
              onClick={() => {
                setTab(value);
                setOffset(0);
              }}
              className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                tab === value
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {label} ({
                value === tab && activityResultIsCurrent
                  ? activitiesTotal
                  : value === 'hosted'
                    ? profile.hosted_count
                    : profile.common_count
              })
            </button>
          ))}
        </div>

        <div
          id="profile-activity-panel"
          role="tabpanel"
          aria-labelledby={`profile-tab-${tab}`}
          className="space-y-5"
        >
          {isLoadingActivities ? (
            <p className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-center text-sm text-neutral-500" role="status">
              Loading activities…
            </p>
          ) : activitiesError ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-center text-sm text-neutral-500">
              <p>{activitiesError}</p>
              <button
                type="button"
                onClick={() => {
                  setActivityReload((current) => current + 1);
                }}
                className="mt-3 font-bold text-orange-600"
              >
                Try again
              </button>
            </div>
          ) : activities.length ? (
            <>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    plan={{
                      ...toActivityPlan(activity),
                      isJoined: activity.is_joined ?? false,
                      isJoining: joiningId === activity.id,
                      canJoin: activity.host_id !== currentUserId,
                    }}
                    onJoin={(id) => void handleJoin(id)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  Showing {offset + 1}–{Math.min(offset + activities.length, activitiesTotal)} of {activitiesTotal}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={offset === 0}
                    onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={offset + PAGE_SIZE >= activitiesTotal}
                    onClick={() => setOffset((current) => current + PAGE_SIZE)}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-center text-sm text-neutral-500">
              {tab === 'hosted'
                ? 'No hosted activities yet.'
                : 'No activities in common yet.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
