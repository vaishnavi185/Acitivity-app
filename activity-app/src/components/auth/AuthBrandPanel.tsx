"use client";

import React from 'react';
import { Sparkles, Compass, Bike, Coffee, CalendarHeart } from 'lucide-react';

export function AuthBrandPanel() {
  return (
    <div className="lg:col-span-5 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Background Pattern Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-white/10 rounded-full blur-xl" />

      {/* Top Brand & Tagline */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-orange-950/15">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm">ActiVibe</span>
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-full uppercase tracking-wider backdrop-blur-xs">Local Connect</span>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Turn Neighbors into Workout Buddies, Foodies & Friends.
          </h1>
          <p className="text-orange-100 text-sm sm:text-base font-light leading-relaxed">
            Discover weekend treks, rooftop board-games, morning runs or impromptu coffee catchups right around your corner.
          </p>
        </div>
      </div>

      {/* Activity Badges / Social Proof Showcase */}
      <div className="my-8 relative z-10 space-y-3">
        <div className="p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3.5 shadow-sm transform transition-all hover:translate-x-1 duration-200">
          <div className="w-10 h-10 rounded-xl bg-orange-400/40 flex items-center justify-center text-amber-100 flex-shrink-0">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Sunrise Cycling Crew</p>
            <p className="text-[11px] text-amber-100">6 members nearby • 2.1 km away</p>
          </div>
        </div>

        <div className="p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3.5 shadow-sm transform transition-all hover:translate-x-1 duration-200">
          <div className="w-10 h-10 rounded-xl bg-amber-400/40 flex items-center justify-center text-amber-100 flex-shrink-0">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Indie Coffee & Book Club</p>
            <p className="text-[11px] text-amber-100">Invited by Aryan • Today 6:00 PM</p>
          </div>
        </div>

        <div className="p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3.5 shadow-sm transform transition-all hover:translate-x-1 duration-200">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/30 flex items-center justify-center text-amber-100 flex-shrink-0">
            <CalendarHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Sunday Badminton Doubles</p>
            <p className="text-[11px] text-amber-100">4 spots open in Sector 48</p>
          </div>
        </div>
      </div>

      {/* Bottom Trust Markers */}
      {/* <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-orange-100">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span>Verified local community</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-amber-200" />
          <span>GPS privacy protected</span>
        </div>
      </div> */}
    </div>
  );
}