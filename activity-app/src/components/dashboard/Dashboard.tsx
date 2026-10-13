"use client";

import { useState } from 'react';
import { useOpenHostPlanModal } from './AppShell';
import { SidebarRight } from './SidebarRight';
import { FeedHeader } from './FeedHeader';
import { ActivityCard, ActivityPlan } from '../activity/ActivityCard';
import { ActivityDetailModal, type ActivityDetailData } from '../activity/ActivityDetailModal';

const SAMPLE_PLANS: ActivityPlan[] = [
  {
    id: 'plan-1',
    title: 'Catan & Secret Hitler Strategy Night',
    category: 'Gaming',
    environment: 'Indoor',
    location: 'Indiranagar, 100ft Road',
    date: 'Saturday, 18 Oct',
    time: '6:30 PM',
    imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&auto=format&fit=crop&q=80',
    hostName: 'Kabir',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    spotsLeft: 2,
    totalSpots: 5,
  },
  {
    id: 'plan-2',
    title: 'Morning Badminton Doubles Rally',
    category: 'Sports',
    environment: 'Indoor',
    location: 'Play Arena, Sarjapur',
    date: 'Sunday, 19 Oct',
    time: '7:00 AM',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    hostName: 'Rohan',
    hostAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    spotsLeft: 1,
    totalSpots: 4,
  },
];

export default function Dashboard() {
  const openHostPlanModal = useOpenHostPlanModal();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetailData | null>(null);
  const filteredPlans = SAMPLE_PLANS.filter((plan) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      plan.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesEnv =
      selectedFilterType === 'all' ||
      plan.environment.toLowerCase() === selectedFilterType.toLowerCase();
    return matchesCategory && matchesEnv;
  });

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <section className="space-y-6 xl:col-span-2">
        <FeedHeader
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedFilterType={selectedFilterType}
          onSelectFilterType={setSelectedFilterType}
          showingCount={filteredPlans.length}
          totalCount={SAMPLE_PLANS.length}
        />

        <div className="space-y-5">
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => (
              <ActivityCard
                key={plan.id}
                plan={plan}
                onJoin={(id) => alert(`Joined plan ID: ${id}`)}
                onCardClick={(clickedPlan) => setSelectedActivity({
                  id: clickedPlan.id,
                  title: clickedPlan.title,
                  category: clickedPlan.category,
                  environment: clickedPlan.environment,
                  coverImage: clickedPlan.imageUrl,
                  date: clickedPlan.date,
                  time: clickedPlan.time,
                  totalGroupSize: clickedPlan.totalSpots,
                  openSpots: clickedPlan.spotsLeft,
                  meetingSpot: clickedPlan.location,
                  description: clickedPlan.description ?? 'More details about this activity will be shared by the host.',
                  host: {
                    name: clickedPlan.hostName,
                    location: clickedPlan.location,
                    avatarUrl: clickedPlan.hostAvatar,
                  },
                  crew: [],
                  isLiked: false,
                  isBookmarked: false,
                  isJoined: false,
                })}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-neutral-500">
                No plans found for this filter.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="xl:col-span-1">
        <SidebarRight onCreateInstantPlan={openHostPlanModal} />
      </div>
      <ActivityDetailModal
        key={selectedActivity?.id ?? 'closed'}
        isOpen={selectedActivity !== null}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
}