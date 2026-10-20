import { authFetch } from './AuthService';
import type { Activity } from './activityService';

export interface PublicProfile {
  id: string;
  full_name: string;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_buddy: boolean;
  is_follower: boolean;
  buddies_count: number;
  followers_count: number;
  is_own_profile: boolean;
  hosted_count: number;
  common_count: number;
}

export type ProfileActivityTab = 'hosted' | 'common';

export interface ProfileActivities {
  tab: ProfileActivityTab;
  total: number;
  items: Activity[];
}

export interface ProfileActivityFilters {
  tab?: ProfileActivityTab;
  limit?: number;
  offset?: number;
}

export function getPublicProfile(userId: string): Promise<PublicProfile> {
  return authFetch(`/profiles/${encodeURIComponent(userId)}`);
}

export function getProfileActivities(
  userId: string,
  filters: ProfileActivityFilters = {},
): Promise<ProfileActivities> {
  const params = new URLSearchParams();

  if (filters.tab !== undefined) params.set('tab', filters.tab);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));

  const query = params.toString();
  return authFetch(
    `/profiles/${encodeURIComponent(userId)}/activities${query ? `?${query}` : ''}`,
  );
}
