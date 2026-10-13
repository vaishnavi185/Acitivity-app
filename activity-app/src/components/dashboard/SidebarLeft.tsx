"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Compass, 
  LayoutGrid, 
  User, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';

interface SidebarLeftProps {
  hostedCount?: number;
  joinedCount?: number;
  cityRankPercentile?: string;
  badgeTitle?: string;
}

export function SidebarLeft({
  hostedCount = 1,
  joinedCount = 1,
  cityRankPercentile = 'Top 15%',
  badgeTitle = 'Socialite',
}: SidebarLeftProps) {
  const pathname = usePathname();
  const navItems = [
    { href: '/dashboard', label: 'Explore Plans', icon: Compass },
    { href: '/dashboard/my-activities', label: 'My Activities', icon: LayoutGrid },
    { href: '/dashboard/profile', label: 'Profile & Saved', icon: User },
  ];

  return (
    <aside className="w-full lg:w-64 flex flex-col gap-5 flex-shrink-0">
      {/* 1. Navigation Menu Card */}
      <div className="bg-white rounded-3xl p-3 border border-neutral-200/80 shadow-2xs space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-50 text-orange-600 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-neutral-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 2. Your Activity Pulse Card */}
      <div className="bg-[#1C1A1A] text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-neutral-400">Your Activity Pulse</span>
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="text-2xl font-black text-white">{hostedCount}</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Hosted Plans</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{joinedCount}</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Joined Plans</div>
          </div>
        </div>

        <div className="pt-3.5 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            City ranking: <strong className="text-neutral-200 font-semibold">{cityRankPercentile}</strong>
          </span>
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            {badgeTitle}
          </span>
        </div>
      </div>

      {/* 3. Host Rule Tip Card */}
      <div className="bg-[#FFF8EC] border border-[#FFE8BA] rounded-3xl p-5 shadow-2xs text-neutral-800">
        <div className="flex items-center gap-2 mb-2 text-orange-700">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Host Rule Tip</h4>
        </div>
        <p className="text-xs leading-relaxed text-neutral-600">
          When creating an activity, set the count for{' '}
          <strong className="text-neutral-900 font-semibold">additional members wanted</strong>. You are automatically counted as the host!
        </p>
      </div>
    </aside>
  );
}