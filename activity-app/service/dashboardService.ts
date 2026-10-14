
import { authFetch } from "./AuthService";
import type { Activity } from "./activityService";

export interface DashboardStats {
  created_count: number;
  joined_count: number;
  upcoming_count: number;
}

export type DashboardActivityType =
  | "created"
  | "joined"
  | "upcoming"
  | "past";

// Get dashboard statistics
export function getDashboardStats(): Promise<DashboardStats> {
  return authFetch("/dashboard/stats");
}

// Get dashboard activities by type
export function getDashboardActivities(
  type: DashboardActivityType
): Promise<Activity[]> {
  const params = new URLSearchParams({ type });

  return authFetch(`/dashboard/activities?${params.toString()}`);
}
