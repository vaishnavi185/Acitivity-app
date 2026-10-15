"use client";

import React from 'react';
import { ChevronRight, Users } from 'lucide-react';

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
  circles = [],
  onSeeAllCircles,
  onCircleClick,
  onCreateInstantPlan,
}: SidebarRightProps) {
  return (
    <aside className="w-full lg:w-72 flex flex-col gap-5 flex-shrink-0">
      {/* 1. Trending Circles */}
      

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