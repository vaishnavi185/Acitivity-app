"use client";

import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { BookmarkedCard, BookmarkedActivity } from './BookmarkedCard';
import { EditProfileForm, type ProfileFormData } from './EditProfileForm';

const INITIAL_PROFILE: ProfileFormData = {
  fullName: 'Aryan Sharma',
  email: 'aryan.sharma@example.com',
  location: 'Indiranagar, Bangalore',
  bio: 'Product designer & weekend trail runner. Always up for badminton, filter coffee, or strategy board games!',
};

const INITIAL_BOOKMARKS: BookmarkedActivity[] = [
  {
    id: 'bm-1',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80',
    category: 'Sports',
    categoryColor: 'text-orange-600',
    title: 'Sunday Badminton Rally & Doubles',
    location: 'Play9 Sports Arena, Indiranagar',
  },
  {
    id: 'bm-2',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&auto=format&fit=crop&q=80',
    category: 'Outdoor Adventures',
    categoryColor: 'text-orange-600',
    title: 'Sunrise Trek to Savandurga Monolith',
    location: 'Savandurga Base Camp (Meeting: Silk Board)',
  },
];

export function ProfileSavedView() {
  const [bookmarks, setBookmarks] = useState<BookmarkedActivity[]>(INITIAL_BOOKMARKS);
  const [profile, setProfile] = useState<ProfileFormData>(INITIAL_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleBookmarkToggle = (id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full space-y-7 animate-in fade-in-50 duration-200">
      {/* 1. Main Profile Header Card */}
      <ProfileHeaderCard
        name={profile.fullName}
        location={profile.location}
        email={profile.email}
        bio={profile.bio}
        onEditProfile={() => setIsEditingProfile((isEditing) => !isEditing)}
      />

      {isEditingProfile && (
        <EditProfileForm
          initialData={profile}
          onSave={(updatedProfile) => {
            setProfile(updatedProfile);
            setIsEditingProfile(false);
          }}
          onCancel={() => setIsEditingProfile(false)}
        />
      )}

      {/* 2. Saved & Bookmarked Section */}
      <div className="space-y-4">
        {/* Section Title with Bookmark Icon */}
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
            Saved & Bookmarked Activities ({bookmarks.length})
          </h2>
        </div>

        {/* Bookmarked Cards Grid (2 columns) */}
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.map((activity) => (
              <BookmarkedCard
                key={activity.id}
                activity={activity}
                onBookmarkToggle={handleBookmarkToggle}
                onClick={(id) => alert(`Activity details clicked: ${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-neutral-200/80">
            <p className="text-xs font-semibold text-neutral-400">
              No saved activities yet. Explore plans to bookmark activities!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}