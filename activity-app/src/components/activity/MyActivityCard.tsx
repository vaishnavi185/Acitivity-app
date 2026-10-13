"use client";

import React from 'react';
import { MapPin, Pencil, Trash2 } from 'lucide-react';

export interface MyActivityData {
  id: string;
  imageUrl: string;
  category: string;
  date: string;
  dateValue?: string;
  time: string;
  startTime?: string;
  endTime?: string;
  title: string;
  location: string;
  environment?: 'Indoor' | 'Outdoor';
  description?: string;
  filledSpots: number;
  totalSpots: number;
}

interface MyActivityCardProps {
  activity: MyActivityData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MyActivityCard({
  activity,
  onEdit,
  onDelete,
}: MyActivityCardProps) {
  const percentage = Math.min(
    100,
    Math.round((activity.filledSpots / activity.totalSpots) * 100)
  );

  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      
      {/* Left Section: Image Thumbnail & Activity Details */}
      <div className="flex items-start gap-4 min-w-0">
        <img
          src={activity.imageUrl}
          alt={activity.title}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover flex-shrink-0"
        />

        <div className="space-y-1.5 min-w-0">
          {/* Category Tag & Date/Time */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold">
              {activity.category}
            </span>
            <span className="text-xs text-neutral-400 font-medium">
              {activity.date} • {activity.time}
            </span>
          </div>

          {/* Activity Title */}
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight truncate">
            {activity.title}
          </h3>

          {/* Location Pin */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
        </div>
      </div>

      {/* Right Section: Group Fill Progress Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-end md:items-end lg:items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-neutral-100">
        
        {/* Progress Bar Container */}
        <div className="w-full sm:w-48 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-neutral-500">Group fill</span>
            <span className="text-neutral-900 font-bold">
              {activity.filledSpots}/{activity.totalSpots} ({percentage}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onEdit?.(activity.id)}
            className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            title="Edit Plan"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(activity.id)}
            className="p-2 rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}