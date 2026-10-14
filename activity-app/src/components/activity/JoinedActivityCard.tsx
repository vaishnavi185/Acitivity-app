"use client";

import { MapPin } from 'lucide-react';
import type { MyActivityData } from './MyActivityCard';

interface JoinedActivityCardProps {
  activity: MyActivityData;
  onClick: (id: string) => void;
}

export function JoinedActivityCard({ activity, onClick }: JoinedActivityCardProps) {
  const percentage = activity.totalSpots > 0
    ? Math.min(100, Math.round((activity.filledSpots / activity.totalSpots) * 100))
    : 0;

  return (
    <button
      type="button"
      onClick={() => onClick(activity.id)}
      className="flex w-full cursor-pointer flex-col items-start justify-between gap-5 rounded-3xl border border-neutral-200/80 bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md md:flex-row md:items-center sm:p-5"
      aria-label={`View details for ${activity.title}`}
    >
      <div className="flex min-w-0 items-start gap-4">
        {activity.imageUrl ? (
          <img
            src={activity.imageUrl}
            alt=""
            className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover sm:h-20 sm:w-20"
          />
        ) : <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-neutral-100 sm:h-20 sm:w-20" aria-label="No activity image available" />}
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-800">
              {activity.category}
            </span>
            <span className="text-xs font-medium text-neutral-400">
              {activity.date} · {activity.time}
            </span>
          </div>
          <h3 className="truncate text-base font-bold tracking-tight text-neutral-900 sm:text-lg">
            {activity.title}
          </h3>
          <div className="flex items-center gap-1.5 truncate text-xs text-neutral-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-1.5 md:w-48 md:flex-shrink-0">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-neutral-500">Group fill</span>
          <span className="font-bold text-neutral-900">
            {activity.filledSpots}/{activity.totalSpots} ({percentage}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </button>
  );
}
