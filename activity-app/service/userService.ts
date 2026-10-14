
import { authFetch } from "./AuthService";
import type { Activity } from "./activityService";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface UserProfileUpdate {
  full_name?: string;
  location?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

// Get current user profile
export function getCurrentUserProfile(): Promise<UserProfile> {
  return authFetch("/users/me");
}

// Update current user profile
export function updateCurrentUserProfile(
  payload: UserProfileUpdate
): Promise<UserProfile> {
  return authFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Get current user's bookmarked activities
export function getCurrentUserBookmarks(): Promise<Activity[]> {
  return authFetch("/users/me/bookmarks");
}
