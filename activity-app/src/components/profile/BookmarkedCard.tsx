"use client";

import React from 'react';
import { Bookmark } from 'lucide-react';

export interface BookmarkedActivity {
  id: string;
  imageUrl: string;
  category: string;
  categoryColor?: string;
  title: string;
  location: string;
}

interface BookmarkedCardProps {
  activity: BookmarkedActivity;
  onBookmarkToggle?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function BookmarkedCard({
  activity,
  onBookmarkToggle,
  onClick,
}: BookmarkedCardProps) {
  return (
    <div
      onClick={() => onClick?.(activity.id)}
      className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 group cursor-pointer"
    >
      {/* Left: Thumbnail & Content */}
      <div className="flex items-center gap-3.5 min-w-0">
        <img
          src={activity.imageUrl}
          alt={activity.title}
          className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
        />

        <div className="space-y-1 min-w-0">
          <span
            className={`text-[11px] font-bold block ${
              activity.categoryColor || 'text-orange-600'
            }`}
          >
            {activity.category}
          </span>

          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-orange-600 transition-colors truncate">
            {activity.title}
          </h3>

          <p className="text-[11px] text-neutral-400 truncate">
            {activity.location}
          </p>
        </div>
      </div>

      {/* Right: Filled Bookmark Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onBookmarkToggle?.(activity.id);
        }}
        className="p-2 rounded-xl text-orange-500 hover:text-orange-600 hover:bg-orange-50/50 transition-colors flex-shrink-0 cursor-pointer"
        title="Remove Bookmark"
      >
        <Bookmark className="w-4 h-4 fill-orange-500 stroke-orange-500" />
      </button>
    </div>
  );
}