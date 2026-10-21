"use client";

import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Search, 
  PlusCircle,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentLocation?: string;
  userName?: string;
  userAvatar?: string;
  onLocationClick?: () => void;
  onSearch?: (query: string) => void;
  onHostPlanClick?: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
}

export function Header({
  currentLocation = 'Bangalore, IN',
  userName = 'Member',
  userAvatar,
  onLocationClick,
  onSearch,
  onHostPlanClick,
  onProfileClick,
  onLogoutClick,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-neutral-200/60 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Brand Identity & Location Selector */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Compass className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="text-lg font-black tracking-tight text-neutral-900 block">
             ActiVibe
              </span>
              <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-400 block -mt-0.5">
                Social Discovery
              </span>
            </div>
          </div>

          {/* Map-based discovery location */}
          <button
            type="button"
            onClick={onLocationClick}
            aria-label="Choose activity search location on map"
            title="Choose search location on map"
            className="flex max-w-[190px] items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs transition-all hover:border-orange-400 hover:bg-orange-50/40"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">{currentLocation || 'Choose location'}</span>
          </button>
        </div>

        {/* Center: Search Field */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search badminton, hikes, board games..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200/90 rounded-full text-xs sm:text-sm placeholder-neutral-400 text-neutral-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Right: Host Plan CTA & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
          {/* Host Plan CTA */}
          <button
            type="button"
            onClick={onHostPlanClick}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-500/20 transition-all duration-200 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="whitespace-nowrap">Host Plan</span>
          </button>

          {/* User Profile Pill */}
          <button
            type="button"
            onClick={onProfileClick}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-full hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-400/40"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 ring-2 ring-orange-400/40 flex items-center justify-center text-xs font-bold">
                {userName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-xs sm:text-sm font-semibold text-neutral-800 hidden sm:inline-block">
              {userName}
            </span>
          </button>
          <button
            type="button"
            onClick={onLogoutClick}
            aria-label="Log out"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>

      </div>
    </header>
  );
}