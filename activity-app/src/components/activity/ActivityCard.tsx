"use client";

import React from 'react';
import { MapPin, Users, Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/service/mediaService';

export interface ActivityPlan {
  id: string;
  hostId: string;
  title: string;
  category: string;
  environment: 'Indoor' | 'Outdoor';
  location: string;
  distanceKm?: number | null;
  date: string;
  time: string;
  imageUrl: string;
  hostName: string;
  hostAvatar: string;
  spotsLeft: number;
  totalSpots: number;
  description?: string;
  isJoined?: boolean;
  isJoining?: boolean;
  canJoin?: boolean;
}

interface ActivityCardProps {
  plan: ActivityPlan;
  onJoin?: (id: string) => void;
  onCardClick?: (plan: ActivityPlan) => void;
}

export function ActivityCard({
  plan,
  onJoin,
  onCardClick,
}: ActivityCardProps) {
  return (
    <div
      onClick={() => onCardClick?.(plan)}
      className="bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer"
    >
      {/* Image Banner with Badges */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-neutral-100">
        {plan.imageUrl ? (
          <img
            src={plan.imageUrl}
            alt={plan.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : <div className="w-full h-full bg-neutral-200" aria-label="No activity image available" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Tags */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-neutral-900/80 backdrop-blur-md text-white text-[11px] font-semibold">
            {plan.category}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-neutral-800 text-[11px] font-semibold">
            {plan.environment}
          </span>
        </div>

        {/* Spots Badge */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {plan.hostAvatar ? (
              <img
                src={resolveMediaUrl(plan.hostAvatar)}
                alt={plan.hostName}
                className="w-7 h-7 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <span className="w-7 h-7 rounded-full border-2 border-white bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold">
                {plan.hostName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <Link
              href={`/dashboard/profile/${encodeURIComponent(plan.hostId)}`}
              onClick={(event) => event.stopPropagation()}
              className="text-xs font-medium drop-shadow-sm hover:underline"
            >
              Hosted by <strong className="font-bold">{plan.hostName}</strong>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span>{plan.spotsLeft} spots left</span>
          </div>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-5 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-1">
          {plan.title}
        </h3>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>
              {plan.location}
              {plan.distanceKm !== null && plan.distanceKm !== undefined
                ? ` · ${plan.distanceKm} km away`
                : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span>{plan.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span>{plan.time}</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
          <span className="text-xs text-neutral-400">
            Total capacity: {plan.totalSpots} people
          </span>

          <button
            type="button"
            disabled={plan.isJoining || plan.canJoin === false}
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.(plan.id);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{plan.isJoining ? 'Updating…' : plan.canJoin === false ? 'Your Activity' : plan.isJoined ? 'Leave Activity' : 'Request to Join'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}