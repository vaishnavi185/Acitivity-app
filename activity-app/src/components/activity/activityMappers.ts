import type { Activity } from "@/service/activityService";
import type { ActivityDetailData } from "./ActivityDetailModal";
import type { ActivityPlan } from "./ActivityCard";
import type { MyActivityData } from "./MyActivityCard";
import type { BookmarkedActivity } from "../profile/BookmarkedCard";

export function formatActivityDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en", options ?? {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatActivityTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date(1970, 0, 1, Number(hours), Number(minutes));
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function toActivityPlan(activity: Activity): ActivityPlan {
  return {
    id: activity.id,
    title: activity.title,
    category: activity.category,
    environment: activity.environment === "indoor" ? "Indoor" : "Outdoor",
    location: activity.location,
    date: formatActivityDate(activity.activity_date),
    time: formatActivityTime(activity.start_time),
    imageUrl: activity.cover_image_url ?? "",
    hostName: activity.host.name,
    hostAvatar: activity.host.avatar_url ?? "",
    spotsLeft: activity.available_slots,
    totalSpots: activity.total_group_size,
    description: activity.description,
  };
}

export function toActivityDetail(
  activity: Activity,
  state: { isJoined: boolean; isBookmarked: boolean; isLiked?: boolean; canJoin?: boolean },
): ActivityDetailData {
  return {
    id: activity.id,
    title: activity.title,
    category: activity.category,
    environment: activity.environment === "indoor" ? "Indoor" : "Outdoor",
    coverImage: activity.cover_image_url ?? "",
    date: formatActivityDate(activity.activity_date, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: `${formatActivityTime(activity.start_time)}–${formatActivityTime(activity.end_time)}`,
    totalGroupSize: activity.total_group_size,
    openSpots: activity.available_slots,
    meetingSpot: activity.location,
    description: activity.description,
    host: {
      name: activity.host.name,
      location: activity.host.location ?? "",
      avatarUrl: activity.host.avatar_url ?? "",
    },
    crew: (activity.crew ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      location: member.location ?? "",
      avatarUrl: member.avatar_url ?? "",
    })),
    ...state,
  };
}

export function toMyActivity(activity: Activity): MyActivityData {
  return {
    id: activity.id,
    imageUrl: activity.cover_image_url ?? "",
    category: activity.category,
    date: formatActivityDate(activity.activity_date),
    dateValue: activity.activity_date,
    time: formatActivityTime(activity.start_time),
    startTime: activity.start_time.slice(0, 5),
    endTime: activity.end_time.slice(0, 5),
    title: activity.title,
    location: activity.location,
    environment: activity.environment === "indoor" ? "Indoor" : "Outdoor",
    description: activity.description,
    filledSpots: activity.joined_count + 1,
    totalSpots: activity.total_group_size,
  };
}

export function toBookmarkedActivity(activity: Activity): BookmarkedActivity {
  return {
    id: activity.id,
    imageUrl: activity.cover_image_url ?? "",
    category: activity.category,
    title: activity.title,
    location: activity.location,
  };
}
