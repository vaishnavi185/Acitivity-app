
import { authFetch } from "./AuthService";

export interface Activity {
  id: string;
  host_id: string;
  category_id: number;
  category: string;
  host: {
    id: string;
    name: string;
    location: string | null;
    avatar_url: string | null;
  };
  title: string;
  description: string;
  cover_image_url: string | null;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  activity_date: string;
  start_time: string;
  end_time: string;
  environment: "indoor" | "outdoor";
  status: string;
  additional_needed: number;
  joined_count: number;
  available_slots: number;
  total_group_size: number;
  likes_count: number;
  crew?: {
    id: string;
    name: string;
    location: string | null;
    avatar_url: string | null;
  }[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_joined?: boolean;
}

export interface ActivityPayload {
  category_id: number;
  title: string;
  description: string;
  cover_image_url?: string | null;
  location: string;
  latitude?: number;
  longitude?: number;
  activity_date: string;
  start_time: string;
  end_time: string;
  environment: "indoor" | "outdoor";
  additional_needed: number;
}

export type ActivityUpdate = Partial<ActivityPayload>;

export interface ActivityFilters {
  search?: string;
  category_id?: number;
  environment?: "indoor" | "outdoor";
  posted_by_buddies?: boolean;
  near_latitude?: number;
  near_longitude?: number;
  radius_km?: number;
  skip?: number;
  limit?: number;
}

export type ActivityFeedFilter = "all" | "indoor" | "outdoor" | "buddies";

// Get all activities with optional filters
export function getActivities(
  filters: ActivityFilters = {}
): Promise<Activity[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return authFetch(`/activities/${query ? `?${query}` : ""}`);
}

// Get activity details
export function getActivityById(
  activityId: string
): Promise<Activity> {
  return authFetch(`/activities/${activityId}`);
}

// Create activity
export function createActivity(
  payload: ActivityPayload
): Promise<Activity> {
  return authFetch("/activities/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Update activity
export function updateActivity(
  activityId: string,
  payload: ActivityUpdate
): Promise<Activity> {
  return authFetch(`/activities/${activityId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Delete activity
export function deleteActivity(
  activityId: string
): Promise<void> {
  return authFetch(`/activities/${activityId}`, {
    method: "DELETE",
  });
}

// Get activities created by current user
export function getMyCreatedActivities(): Promise<Activity[]> {
  return authFetch("/activities/my/created");
}

// Get activities joined by current user
export function getMyJoinedActivities(): Promise<Activity[]> {
  return authFetch("/activities/my/joined");
}

// Get joined activities count
export function getMyJoinedActivityCount(): Promise<number> {
  return authFetch("/activities/my/joined/count");
}

// Join activity
export function joinActivity(
  activityId: string
): Promise<Activity> {
  return authFetch(`/activities/${activityId}/join`, {
    method: "POST",
  });
}

// Leave activity
export function leaveActivity(
  activityId: string
): Promise<Activity> {
  return authFetch(`/activities/${activityId}/leave`, {
    method: "POST",
  });
}

// Toggle like
export interface ActivitySocialState {
  activity_id: string;
  is_liked: boolean;
  is_bookmarked: boolean;
  likes_count: number;
}

export function toggleActivityLike(activityId: string): Promise<ActivitySocialState> {
  return authFetch(`/activities/${activityId}/like`, {
    method: "POST",
  });
}

// Toggle bookmark
export function toggleActivityBookmark(activityId: string): Promise<ActivitySocialState> {
  return authFetch(`/activities/${activityId}/bookmark`, {
    method: "POST",
  });
}
