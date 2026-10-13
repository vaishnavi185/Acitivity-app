"use client";

import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  ChevronDown, 
  Search, 
  PlusCircle 
} from 'lucide-react';

interface HeaderProps {
  currentLocation?: string;
  userName?: string;
  userAvatar?: string;
  onLocationChange?: (location: string) => void;
  onSearch?: (query: string) => void;
  onHostPlanClick?: () => void;
  onProfileClick?: () => void;
}

export function Header({
  currentLocation = 'Bangalore, IN',
  userName = 'Aryan',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  onLocationChange,
  onSearch,
  onHostPlanClick,
  onProfileClick,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);

  const locations = [
    'Bangalore, IN',
    'Delhi NCR, IN',
    'Mumbai, IN',
    'Pune, IN',
    'Hyderabad, IN'
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleSelectLocation = (loc: string) => {
    setSelectedLocation(loc);
    setLocationMenuOpen(false);
    onLocationChange?.(loc);
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
                GatherUp
              </span>
              <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-400 block -mt-0.5">
                Social Discovery
              </span>
            </div>
          </div>

          {/* Location Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocationMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:border-orange-300 hover:bg-orange-50/40 transition-all shadow-2xs cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span className="truncate max-w-[110px]">{selectedLocation}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
            </button>

            {locationMenuOpen && (
              <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-white border border-neutral-200 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full text-left px-3.5 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer ${
                      selectedLocation === loc ? 'font-bold text-orange-600 bg-orange-50/50' : 'text-neutral-700'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            <img
              src={userAvatar}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-400/40"
            />
            <span className="text-xs sm:text-sm font-semibold text-neutral-800 hidden sm:inline-block">
              {userName}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
}