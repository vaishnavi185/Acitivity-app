"use client";

import { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { SidebarLeft } from './SidebarLeft';
import { HostPlanModal } from '../plan/HostPlanModal';

const HostPlanModalContext = createContext<(() => void) | null>(null);

export function useOpenHostPlanModal() {
  const openHostPlanModal = useContext(HostPlanModalContext);
  if (!openHostPlanModal) {
    throw new Error('useOpenHostPlanModal must be used within the dashboard shell.');
  }
  return openHostPlanModal;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const [isHostPlanModalOpen, setIsHostPlanModalOpen] = useState(false);

  if (!isDashboardRoute) {
    return children;
  }

  return (
    <HostPlanModalContext.Provider value={() => setIsHostPlanModalOpen(true)}>
      <div className="min-h-screen bg-[#FAF8F5] font-sans text-neutral-800 selection:bg-orange-500 selection:text-white">
        <Header onHostPlanClick={() => setIsHostPlanModalOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:sticky lg:top-24 lg:col-span-3 lg:self-start">
              <SidebarLeft />
            </div>
            <div className="min-w-0 lg:col-span-9">{children}</div>
          </div>
        </main>
        <HostPlanModal
          isOpen={isHostPlanModalOpen}
          onClose={() => setIsHostPlanModalOpen(false)}
        />
      </div>
    </HostPlanModalContext.Provider>
  );
}
