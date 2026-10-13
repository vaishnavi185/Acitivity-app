"use client";

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  MapPin, 
  Heart, 
  Bookmark 
} from 'lucide-react';
import { Toast } from '../auth/AuthToast';


export interface CrewMember {
  id: string;
  name: string;
  location: string;
  avatarUrl: string;
  isCurrentUser?: boolean;
}

export interface ActivityDetailData {
  id: string;
  title: string;
  category: string;
  environment: string;
  coverImage: string;
  date: string;
  time: string;
  totalGroupSize: number;
  openSpots: number;
  meetingSpot: string;
  description: string;
  host: {
    name: string;
    location: string;
    avatarUrl: string;
  };
  crew: CrewMember[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  isJoined?: boolean;
}

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityDetailData | null;
  onLikeChange?: (isLiked: boolean) => void;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  onJoinToggle?: (isJoined: boolean) => void;
}

export function ActivityDetailModal({
  isOpen,
  onClose,
  activity,
  onLikeChange,
  onBookmarkChange,
  onJoinToggle,
}: ActivityDetailModalProps) {
  // Local interaction states
  const [isLiked, setIsLiked] = useState<boolean>(() => activity?.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => activity?.isBookmarked ?? true);
  const [isJoined, setIsJoined] = useState<boolean>(() => activity?.isJoined ?? true);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !activity) return null;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // Like Toggle Handler
  const handleLikeToggle = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    onLikeChange?.(nextState);
    if (nextState) {
      showToast('Added to your liked plans! ❤️', 'success');
    } else {
      showToast('Removed from liked plans.', 'error');
    }
  };

  // Bookmark Toggle Handler
  const handleBookmarkToggle = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    onBookmarkChange?.(nextState);
    if (nextState) {
      showToast('Activity bookmarked successfully! 🔖', 'success');
    } else {
      showToast('Removed from bookmarks.', 'error');
    }
  };

  // Join / Leave Activity Handler
  const handleJoinToggle = () => {
    const nextState = !isJoined;
    setIsJoined(nextState);
    onJoinToggle?.(nextState);
    if (nextState) {
      showToast('🎉 You have joined this activity!', 'success');
    } else {
      showToast('You left the activity group.', 'error');
    }
  };

  return (
    <>
      {/* Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-100 my-auto overflow-hidden flex flex-col max-h-[92vh] relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Close Button Overlay */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-neutral-700 shadow-md flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto flex-1">
            {/* 1. Hero Image & Header */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-900">
              <img
                src={activity.coverImage}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-orange-600 text-white text-[11px] font-black uppercase tracking-wider">
                    {activity.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold">
                    {activity.environment}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
                  {activity.title}
                </h1>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* 2. Key Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-[#FAF8F5] border border-neutral-200/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    <span>Date</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-neutral-900">
                    {activity.date}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Timing</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-neutral-900">
                    {activity.time}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    <span>Group Size</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-neutral-900">
                    {activity.totalGroupSize} people total
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Open Spots</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-600">
                    {activity.openSpots} Remaining
                  </div>
                </div>
              </div>

              {/* 3. Meeting Spot Card */}
              <div className="p-4 rounded-2xl bg-[#FFFBF7] border border-[#FFE8D6] flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Meeting Spot</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">{activity.meetingSpot}</p>
                </div>
              </div>

              {/* 4. About This Plan */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight">
                  About this plan
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {activity.description}
                </p>
              </div>

              {/* 5. Organized By */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase block">
                  Organized by
                </span>
                <div className="flex items-center gap-3">
                  <img
                    src={activity.host.avatarUrl}
                    alt={activity.host.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-orange-400/30"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                      {activity.host.name}
                    </h4>
                    <p className="text-xs text-neutral-400">{activity.host.location}</p>
                  </div>
                </div>
              </div>

              {/* 6. Joined Crew */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
                    Joined Crew ({activity.crew.length} / {activity.totalGroupSize - 1} Wanted)
                  </span>
                  <span className="text-[11px] text-neutral-400">Host is auto-confirmed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activity.crew.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-2xl bg-[#FAF8F5] border border-neutral-200/80 flex items-center gap-3"
                    >
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {member.name}{' '}
                          {member.isCurrentUser && (
                            <span className="text-orange-600 font-semibold">(You)</span>
                          )}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {member.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Bottom Action Bar */}
          <div className="p-4 sm:p-5 border-t border-neutral-100 bg-white flex items-center justify-between gap-4 flex-shrink-0">
            {/* Like and Bookmark Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLikeToggle}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-2xs'
                    : 'bg-white border-neutral-200/80 text-neutral-400 hover:text-rose-500 hover:bg-neutral-50'
                }`}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleBookmarkToggle}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-orange-50 border-orange-200 text-orange-500 shadow-2xs'
                    : 'bg-white border-neutral-200/80 text-neutral-400 hover:text-orange-500 hover:bg-neutral-50'
                }`}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-orange-500' : ''}`} />
              </button>
            </div>

            {/* Join / Leave Action Button */}
            {isJoined ? (
              <button
                type="button"
                onClick={handleJoinToggle}
                className="px-6 py-3 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-rose-600 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                Leave Activity
              </button>
            ) : (
              <button
                type="button"
                onClick={handleJoinToggle}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Join Activity
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}