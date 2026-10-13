"use client";

import React, { useState } from 'react';

export interface ProfileFormData {
  fullName: string;
  email: string;
  location: string;
  bio: string;
}

interface EditProfileFormProps {
  initialData?: ProfileFormData;
  onSave?: (data: ProfileFormData) => void;
  onCancel?: () => void;
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
}: EditProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>(initialData);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
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
              onChange={handleInputChange}
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
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g. Indiranagar, Bangalore"
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
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
            className="px-6 py-2.5 rounded-2xl bg-[#FF4D24] hover:bg-[#E63E17] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}