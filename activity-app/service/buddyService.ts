// services/buddyService.ts
import { authFetch } from "./AuthService"; // path apne hisaab se badal le

// ---------- Types (backend schemas ke jaise) ----------
export interface BuddyUser {
  id: string;
  full_name: string;
  location?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface BuddyListItem {
  user: BuddyUser;
  created_at: string;
}

export interface BuddyListResponse {
  total: number;
  items: BuddyListItem[];
}

export interface BuddyStatus {
  is_buddy: boolean;
  is_follower: boolean;
  buddies_count: number;
  followers_count: number;
}

export interface BuddyActionResponse {
  message: string;
  is_buddy: boolean;
}

// ---------- Add / Remove ----------
export function addBuddy(userId: string): Promise<BuddyActionResponse> {
  return authFetch(`/buddies/${userId}`, { method: "POST" });
}

export function removeBuddy(userId: string): Promise<BuddyActionResponse> {
  return authFetch(`/buddies/${userId}`, { method: "DELETE" });
}

// ---------- Status (button state + counts) ----------
export function getBuddyStatus(userId: string): Promise<BuddyStatus> {
  return authFetch(`/buddies/${userId}/status`);
}

// ---------- Lists ----------
export function getBuddies(
  userId: string,
  limit = 20,
  offset = 0
): Promise<BuddyListResponse> {
  return authFetch(`/buddies/${userId}/buddies?limit=${limit}&offset=${offset}`);
}

export function getFollowers(
  userId: string,
  limit = 20,
  offset = 0
): Promise<BuddyListResponse> {
  return authFetch(`/buddies/${userId}/followers?limit=${limit}&offset=${offset}`);
}

export function getMyBuddies(
  limit = 20,
  offset = 0
): Promise<BuddyListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return authFetch(`/buddies/me?${params.toString()}`);
}
