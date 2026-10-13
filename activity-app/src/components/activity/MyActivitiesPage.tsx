"use client";

import { useState } from 'react';
import { MyActivityCard, type MyActivityData } from '@/src/components/activity/MyActivityCard';
import { JoinedActivityCard } from './JoinedActivityCard';
import { ActivityDetailModal, type ActivityDetailData } from './ActivityDetailModal';
import { StatCard } from '@/src/components/dashboard/StatCard';
import { EditActivityModal, type EditPlanData } from '@/src/components/plan/EditActivityModal';

type JoinedActivityData = MyActivityData & {
  hostName: string;
  hostLocation: string;
  hostAvatar: string;
};

const initialHostedActivities: MyActivityData[] = [
  {
    id: 'activity-1',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80',
    category: 'Sports',
    date: 'Sunday, 19 Oct',
    dateValue: '2025-10-19',
    time: '7:00 AM',
    startTime: '07:00',
    endTime: '09:00',
    environment: 'Indoor',
    description: '',
    title: 'Morning Badminton Doubles Rally',
    location: 'Play Arena, Sarjapur',
    filledSpots: 3,
    totalSpots: 4,
  },
];

const initialJoinedActivities: JoinedActivityData[] = [
  {
    id: 'activity-2',
    imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&auto=format&fit=crop&q=80',
    category: 'Gaming',
    date: 'Saturday, 18 Oct',
    dateValue: '2025-10-18',
    time: '6:30 PM',
    startTime: '18:30',
    endTime: '20:30',
    environment: 'Indoor',
    description: '',
    title: 'Catan & Strategy Night',
    location: 'Indiranagar, 100ft Road',
    filledSpots: 3,
    totalSpots: 5,
    hostName: 'Kabir',
    hostLocation: 'Indiranagar, Bangalore',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

function formatTime(time: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`1970-01-01T${time}:00`));
}

export default function MyActivitiesPage() {
  const [hostedActivities, setHostedActivities] = useState(initialHostedActivities);
  const joinedActivities = initialJoinedActivities;
  const [activeActivityList, setActiveActivityList] = useState<'hosted' | 'joined'>('hosted');
  const [activityToEdit, setActivityToEdit] = useState<EditPlanData | null>(null);
  const [activityToView, setActivityToView] = useState<ActivityDetailData | null>(null);

  const handleEdit = (id: string) => {
    const activity = hostedActivities.find((item) => item.id === id);
    if (!activity) return;

    setActivityToEdit({
      id: activity.id,
      title: activity.title,
      category: activity.category,
      environment: activity.environment ?? 'Indoor',
      description: activity.description ?? '',
      location: activity.location,
      date: activity.dateValue ?? '2025-10-19',
      startTime: activity.startTime ?? '17:00',
      endTime: activity.endTime ?? '19:00',
      additionalParticipants: Math.max(1, activity.totalSpots - 1),
      coverImage: activity.imageUrl,
    });
  };

  const handleViewDetails = (id: string) => {
    const activity = joinedActivities.find((item) => item.id === id);
    if (!activity) return;

    setActivityToView({
      id: activity.id,
      title: activity.title,
      category: activity.category,
      environment: activity.environment ?? 'Indoor',
      coverImage: activity.imageUrl,
      date: activity.date,
      time: activity.time,
      totalGroupSize: activity.totalSpots,
      openSpots: Math.max(0, activity.totalSpots - activity.filledSpots),
      meetingSpot: activity.location,
      description: activity.description || 'Activity details will be shared by the host.',
      host: {
        name: activity.hostName,
        location: activity.hostLocation,
        avatarUrl: activity.hostAvatar,
      },
      crew: [],
      isLiked: false,
      isBookmarked: false,
      isJoined: true,
    });
  };

  const handleSave = (updatedPlan: EditPlanData) => {
    setHostedActivities((currentActivities) =>
      currentActivities.map((activity) =>
        activity.id === updatedPlan.id
          ? {
              ...activity,
              title: updatedPlan.title,
              category: updatedPlan.category,
              location: updatedPlan.location,
              imageUrl: updatedPlan.coverImage,
              dateValue: updatedPlan.date,
              date: formatDate(updatedPlan.date),
              startTime: updatedPlan.startTime,
              endTime: updatedPlan.endTime,
              time: formatTime(updatedPlan.startTime),
              environment: updatedPlan.environment,
              description: updatedPlan.description,
              totalSpots: updatedPlan.additionalParticipants + 1,
            }
          : activity
      )
    );
  };

  return (
    <>
      <section className="space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Your plans</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Activity Hub</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage the plans you host and the activities you join.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Hosted Plans"
            count={hostedActivities.length}
            isHighlighted
            isSelected={activeActivityList === 'hosted'}
            onClick={() => setActiveActivityList('hosted')}
          />
          <StatCard
            label="Joined Plans"
            count={joinedActivities.length}
            isSelected={activeActivityList === 'joined'}
            onClick={() => setActiveActivityList('joined')}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-900">Upcoming Activities</h2>
          {activeActivityList === 'hosted' ? (
            <section aria-labelledby="hosted-activities-heading" className="space-y-3">
              <h3 id="hosted-activities-heading" className="text-sm font-semibold text-neutral-700">
                Hosted Activities
              </h3>
              {hostedActivities.length > 0 ? hostedActivities.map((activity) => (
                <MyActivityCard
                  key={activity.id}
                  activity={activity}
                  onEdit={handleEdit}
                  onDelete={(id) => alert(`Delete activity: ${id}`)}
                />
              )) : (
                <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500">You have no hosted activities yet.</p>
              )}
            </section>
          ) : (
            <section aria-labelledby="joined-activities-heading" className="space-y-3">
              <h3 id="joined-activities-heading" className="text-sm font-semibold text-neutral-700">
                Joined Activities
              </h3>
              {joinedActivities.length > 0 ? joinedActivities.map((activity) => (
                <JoinedActivityCard
                  key={activity.id}
                  activity={activity}
                  onClick={handleViewDetails}
                />
              )) : (
                <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500">You have not joined any activities yet.</p>
              )}
            </section>
          )}
        </div>
      </section>
      <EditActivityModal
        key={activityToEdit?.id ?? 'closed'}
        isOpen={activityToEdit !== null}
        initialData={activityToEdit}
        onClose={() => setActivityToEdit(null)}
        onSave={handleSave}
      />
      <ActivityDetailModal
        key={activityToView?.id ?? 'closed-detail'}
        isOpen={activityToView !== null}
        activity={activityToView}
        onClose={() => setActivityToView(null)}
      />
    </>
  );
}
