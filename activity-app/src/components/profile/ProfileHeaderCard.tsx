"use client";

import React from 'react';
import { MapPin, Camera } from 'lucide-react';

interface ProfileHeaderCardProps {
  name?: string;
  location?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  onEditProfile?: () => void;
  onAvatarUpload?: () => void;
}

export function ProfileHeaderCard({
  name = 'Aryan Sharma',
  location = 'Indiranagar, Bangalore',
  email = 'aryan.sharma@example.com',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  bio = 'Product designer & weekend trail runner. Always up for badminton, filter coffee, or strategy board games!',
  onEditProfile,
  onAvatarUpload,
}: ProfileHeaderCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-2xs space-y-6">
      {/* Top Details Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        
        {/* Avatar & User Details */}
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Badge */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-sm">
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <button
              type="button"
              onClick={onAvatarUpload}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-neutral-900 border-2 border-white flex items-center justify-center text-white hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
              title="Change photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Name & Metadata */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              {name}
            </h1>
            
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span>{location}</span>
            </div>

            <p className="text-xs text-neutral-400">
              {email}
            </p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          type="button"
          onClick={onEditProfile}
          className="px-5 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer self-start sm:self-center"
        >
          Edit Profile
        </button>
      </div>

      {/* Bio Section */}
      <div className="pt-2 border-t border-neutral-100">
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
          {bio}
        </p>
      </div>
    </div>
  );
}