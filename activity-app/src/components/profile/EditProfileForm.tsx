"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPinned } from 'lucide-react';
import type { LocationMapSelection } from '@/src/components/plan/LocationMapPickerModal';

const LocationMapPickerModal = dynamic(
  () => import('@/src/components/plan/LocationMapPickerModal').then((module) => module.LocationMapPickerModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="status">
        <div className="rounded-2xl bg-white px-5 py-4 text-sm font-medium text-neutral-700 shadow-xl">
          Loading map…
        </div>
      </div>
    ),
  }
);

export interface ProfileFormData {
  fullName: string;
  email: string;
  location: string;
  bio: string;
}

interface EditProfileFormProps {
  initialData?: ProfileFormData;
  onSave?: (data: ProfileFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function EditProfileForm({
  initialData = {
    fullName: 'Aryan Sharma',
    email: 'aryan.sharma@example.com',
    location: 'Indiranagar, Bangalore',
    bio: 'Product designer & weekend trail runner. Always up for badminton, filter coffee, or strategy board games!',
  },
  onSave,
  onCancel,
  isSaving = false,
}: EditProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>(initialData);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'location') {
      setSelectedCoordinates(null);
    }
  };

  const handleLocationConfirm = (selection: LocationMapSelection) => {
    setFormData((current) => ({ ...current, location: selection.address }));
    setSelectedCoordinates({
      latitude: selection.latitude,
      longitude: selection.longitude,
    });
    setIsLocationPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave?.(formData);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      {/* Card Header Title */}
      <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight mb-6">
        Edit Personal Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Full Name & Email Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              minLength={2}
              maxLength={120}
              required
              placeholder="e.g. Aryan Sharma"
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              placeholder="e.g. aryan.sharma@example.com"
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Row 2: Location / Area */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 mb-2">
            Location / Area
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              maxLength={120}
              placeholder="e.g. Indiranagar, Bangalore"
              className="w-full min-w-0 flex-1 px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setIsLocationPickerOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition-colors hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <MapPinned className="h-4 w-4" />
              Choose on Map
            </button>
          </div>
          {selectedCoordinates && (
            <p className="mt-2 text-xs text-neutral-500">
              Map location selected
            </p>
          )}
        </div>

        {/* Row 3: Bio */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 mb-2">
            Bio
          </label>
          <textarea
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleInputChange}
            maxLength={500}
            placeholder="Tell people about yourself, your hobbies, favorite activities..."
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
          />
        </div>

        {/* Form Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-2xl bg-[#FF4D24] hover:bg-[#E63E17] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
      {isLocationPickerOpen && (
        <LocationMapPickerModal
          initialSelection={
            selectedCoordinates
              ? { ...selectedCoordinates, address: formData.location }
              : null
          }
          onCancel={() => setIsLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
    </div>
  );
}