"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { ActivityFeedFilter } from '@/service/activityService';
import type { Category } from '@/service/categoryService';

interface FeedHeaderProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  selectedFilterType?: ActivityFeedFilter;
  onSelectFilterType?: (type: ActivityFeedFilter) => void;
  locationLabel?: string;
  radiusKm?: number;
  showingCount?: number;
  totalCount?: number;
  categories?: Category[];
}

export function FeedHeader({
  selectedCategory = 'All',
  onSelectCategory,
  selectedFilterType = 'all',
  onSelectFilterType,
  locationLabel,
  radiusKm = 25,
  showingCount = 1,
  totalCount = 5,
  categories = [],
}: FeedHeaderProps) {
  return (
    <div className="space-y-6">
      {/* 1. Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#FFF7ED] via-[#FFF3D6] to-[#FFEEDB] p-6 sm:p-8 border border-[#FED7AA]/50 overflow-hidden shadow-2xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-orange-200/60 text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-4 shadow-2xs">
          <Sparkles className="w-3 h-3 text-orange-500" />
          <span>What are you up to today?</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight max-w-lg">
          Find your next plan. <br />
          Join real people in your neighborhood.
        </h1>

        <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 max-w-xl leading-relaxed">
          From quick badminton doubles to weekend morning coffee sprints—discover curated local social plans or post your own.
        </p>
      </div>

      {/* 2. Top Scrollable Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[{ id: null, name: 'All' }, ...categories].map((category) => {
          const isActive = selectedCategory === category.name;
          return (
            <button
              key={category.id ?? 'all'}
              type="button"
              onClick={() => onSelectCategory?.(category.name)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-orange-600 border border-orange-200 shadow-2xs'
                  : 'bg-white/80 text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {/* 3. Sub-filter Pills & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="w-full text-xs text-neutral-500">
          Nearby plans within {radiusKm} km
          {locationLabel ? ` of ${locationLabel}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {([
            { type: 'all', label: 'All' },
            { type: 'indoor', label: 'Indoor' },
            { type: 'outdoor', label: 'Outdoor' },
            { type: 'buddies', label: 'Posted by buddy' },
          ] as const).map(({ type, label }) => {
            const isActive = selectedFilterType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelectFilterType?.(type)}
                aria-pressed={isActive}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-neutral-400">
          Showing <strong className="text-neutral-700 font-semibold">{showingCount}</strong> of {totalCount} plans
        </span>
      </div>
    </div>
  );
}