"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from './Header';
import { SidebarLeft } from './SidebarLeft';
import { HostPlanModal, type NewPlanFormData } from '../plan/HostPlanModal';
import { useAuth } from '../auth/AuthProvider';
import { ApiError } from '@/service/AuthService';
import { createActivity, type ActivityPayload } from '@/service/activityService';
import { getAllCategories, type Category } from '@/service/categoryService';
import { getDashboardStats, type DashboardStats } from '@/service/dashboardService';
import { getCurrentUserProfile, type UserProfile } from '@/service/userService';

const HostPlanModalContext = createContext<(() => void) | null>(null);
interface DashboardContextValue {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  currentUserId: string | null;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useOpenHostPlanModal() {
  const openHostPlanModal = useContext(HostPlanModalContext);
  if (!openHostPlanModal) {
    throw new Error('useOpenHostPlanModal must be used within the dashboard shell.');
  }
  return openHostPlanModal;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within the dashboard shell.');
  }
  return context;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, notify } = useAuth();
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const [isHostPlanModalOpen, setIsHostPlanModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    created_count: 0,
    joined_count: 0,
    upcoming_count: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await getDashboardStats());
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        notify(error instanceof Error ? error.message : 'Unable to load dashboard statistics.', 'error');
      }
    } finally {
      setStatsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!isDashboardRoute) return;
    let active = true;

    getAllCategories()
      .then((result) => {
        if (active) setCategories(result);
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          notify(error instanceof Error ? error.message : 'Unable to load categories.', 'error');
        }
      });

    getCurrentUserProfile()
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          notify(error instanceof Error ? error.message : 'Unable to load your profile.', 'error');
        }
      });

    const handleProfileRefresh = () => {
      getCurrentUserProfile()
        .then((result) => {
          if (active) setProfile(result);
        })
        .catch((error: unknown) => {
          if (active && !(error instanceof ApiError && error.status === 401)) {
            notify(error instanceof Error ? error.message : 'Unable to refresh your profile.', 'error');
          }
        });
    };

    const statsRefresh = window.setTimeout(() => void refreshStats(), 0);

    const handleDashboardRefresh = () => {
      void refreshStats();
    };
    window.addEventListener('app:dashboard-refresh', handleDashboardRefresh);
    window.addEventListener('app:profile-refresh', handleProfileRefresh);
    return () => {
      active = false;
      window.clearTimeout(statsRefresh);
      window.removeEventListener('app:dashboard-refresh', handleDashboardRefresh);
      window.removeEventListener('app:profile-refresh', handleProfileRefresh);
    };
  }, [isDashboardRoute, notify, refreshStats]);

  const handleCreateActivity = async (form: NewPlanFormData) => {
    const payload: ActivityPayload = {
      category_id: form.categoryId,
      title: form.title.trim(),
      description: form.description.trim(),
      cover_image_url: form.coverImage || null,
      location: form.location.trim(),
      activity_date: form.date,
      start_time: form.startTime,
      end_time: form.endTime,
      environment: form.environment === 'Indoor' ? 'indoor' : 'outdoor',
      additional_needed: form.additionalParticipants,
    };
    try {
      await createActivity(payload);
      notify('Your activity has been published.', 'success');
      window.dispatchEvent(new Event('app:activities-updated'));
      window.dispatchEvent(new Event('app:dashboard-refresh'));
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        notify(error instanceof Error ? error.message : 'Unable to create activity.', 'error');
      }
      throw error;
    }
  };

  if (!isDashboardRoute) {
    return children;
  }

  return (
    <DashboardContext.Provider value={{ categories, searchQuery, setSearchQuery, currentUserId: profile?.id ?? null }}>
      <HostPlanModalContext.Provider value={() => setIsHostPlanModalOpen(true)}>
      <div className="min-h-screen bg-[#FAF8F5] font-sans text-neutral-800 selection:bg-orange-500 selection:text-white">
        <Header
          currentLocation={profile?.location ?? ''}
          userName={profile?.full_name ?? 'Member'}
          userAvatar={profile?.avatar_url ?? undefined}
          onSearch={setSearchQuery}
          onLocationChange={setSearchQuery}
          onHostPlanClick={() => setIsHostPlanModalOpen(true)}
          onProfileClick={() => router.push('/dashboard/profile')}
          onLogoutClick={logout}
        />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:sticky lg:top-24 lg:col-span-3 lg:self-start">
              <SidebarLeft
                hostedCount={statsLoading ? '...' : stats.created_count}
                joinedCount={statsLoading ? '...' : stats.joined_count}
                upcomingCount={statsLoading ? '...' : stats.upcoming_count}
              />
            </div>
            <div className="min-w-0 lg:col-span-9">{children}</div>
          </div>
        </main>
        <HostPlanModal
          isOpen={isHostPlanModalOpen}
          categories={categories}
          onClose={() => setIsHostPlanModalOpen(false)}
          onSubmit={handleCreateActivity}
        />
      </div>
      </HostPlanModalContext.Provider>
    </DashboardContext.Provider>
  );
}
