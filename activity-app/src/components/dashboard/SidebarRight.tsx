"use client";

import React from 'react';
import { ChevronRight, Users, Sparkles } from 'lucide-react';

interface CircleItem {
  id: string;
  name: string;
  members: string;
  icon: string;
}

interface SidebarRightProps {
  circles?: CircleItem[];
  onSeeAllCircles?: () => void;
  onCircleClick?: (circleId: string) => void;
  onCreateInstantPlan?: () => void;
}

export function SidebarRight({
  circles = [
    { id: '1', name: 'Bangalore Boardgamers', members: '1.2k members', icon: '🎲' },
    { id: '2', name: 'Weekend Trekkers Club', members: '3.4k members', icon: '🥾' },
    { id: '3', name: 'Indiranagar Smashers (Badminton)', members: '890 members', icon: '🏸' },
    { id: '4', name: 'Early Stage Indie Co-working', members: '640 members', icon: '💻' },
  ],
  onSeeAllCircles,
  onCircleClick,
  onCreateInstantPlan,
}: SidebarRightProps) {
  return (
    <aside className="w-full lg:w-72 flex flex-col gap-5 flex-shrink-0">
      {/* 1. Trending Circles */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight">Trending Circles</h3>
          <button
            type="button"
            onClick={onSeeAllCircles}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
          >
            See all
          </button>
        </div>

        <div className="space-y-3">
          {circles.map((circle) => (
            <button
              key={circle.id}
              type="button"
              onClick={() => onCircleClick?.(circle.id)}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-neutral-50 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-base flex-shrink-0 group-hover:scale-105 transition-transform">
                  {circle.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-800 truncate group-hover:text-orange-600 transition-colors">
                    {circle.name}
                  </p>
                  <p className="text-[11px] text-neutral-400">{circle.members}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Spontaneous Plan Card */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-2xs flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
          <Users className="w-6 h-6 stroke-[2]" />
        </div>

        <h4 className="text-sm font-extrabold text-neutral-900 mb-1.5">
          Have a spontaneous plan?
        </h4>
        <p className="text-xs text-neutral-500 leading-relaxed mb-4">
          Don&apos;t wait for friends to be free. Host a meetup and let verified locals join you!
        </p>

        <button
          type="button"
          onClick={onCreateInstantPlan}
          className="w-full py-2.5 px-4 rounded-xl bg-[#1C1A1A] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs active:scale-[0.99] transition-all cursor-pointer"
        >
          Create Instant Plan
        </button>
      </div>
    </aside>
  );
}