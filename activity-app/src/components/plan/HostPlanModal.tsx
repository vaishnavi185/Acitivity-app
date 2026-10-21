"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, 
  MapPin, 
  MapPinned,
  Info, 
  Check, 
  ChevronDown 
} from 'lucide-react';
import type { Category } from '@/service/categoryService';
import { searchLocations } from '@/service/geocodingService';
import { useAuth } from '../auth/AuthProvider';

interface LocationSelection {
  latitude: number;
  longitude: number;
  address: string;
}

const LocationMapPickerModal = dynamic(
  () => import('./LocationMapPickerModal').then((module) => module.LocationMapPickerModal),
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

export interface NewPlanFormData {
  title: string;
  categoryId: number;
  environment: 'Indoor' | 'Outdoor';
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  startTime: string;
  endTime: string;
  additionalParticipants: number;
  coverImage: string;
}

interface HostPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: NewPlanFormData) => Promise<void>;
  categories: Category[];
}

const COVER_OPTIONS = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
    alt: 'Badminton',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&auto=format&fit=crop&q=80',
    alt: 'Mountain Trek',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80',
    alt: 'Board Games',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    alt: 'Co-working and Study',
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
    alt: 'Cafe and Coffee',
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80',
    alt: 'Music and Mic',
  },
];

export function HostPlanModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
}: HostPlanModalProps) {
  const { notify } = useAuth();
  const [formData, setFormData] = useState<NewPlanFormData>({
    title: '',
    categoryId: 0,
    environment: 'Indoor',
    description: '',
    location: '',
    date: '2026-10-20',
    startTime: '17:00',
    endTime: '19:00',
    additionalParticipants: 3,
    coverImage: COVER_OPTIONS[0].url,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'location') {
      setSelectedCoordinates(null);
    }
  };

  const handleLocationConfirm = (selection: LocationSelection) => {
    setFormData((previous) => ({ ...previous, location: selection.address }));
    setSelectedCoordinates({
      latitude: selection.latitude,
      longitude: selection.longitude,
    });
    setIsLocationPickerOpen(false);
  };

  const incrementCount = () => {
    setFormData((prev) => ({
      ...prev,
      additionalParticipants: prev.additionalParticipants + 1,
    }));
  };

  const decrementCount = () => {
    setFormData((prev) => ({
      ...prev,
      additionalParticipants: Math.max(1, prev.additionalParticipants - 1),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim().length < 3) {
      notify('Activity title must be at least 3 characters.', 'error');
      return;
    }
    const categoryId = formData.categoryId || categories[0]?.id;
    if (!categoryId) {
      notify('Select a category before publishing.', 'error');
      return;
    }
    if (formData.location.trim().length < 2) {
      notify('Location must be at least 2 characters.', 'error');
      return;
    }
    if (!formData.date || !formData.startTime || !formData.endTime) {
      notify('Provide an activity date, start time, and end time.', 'error');
      return;
    }
    if (formData.endTime <= formData.startTime) {
      notify('End time must be after start time.', 'error');
      return;
    }
    if (!onSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let coordinates = selectedCoordinates;
      if (!coordinates) {
        try {
          const [result] = await searchLocations(formData.location.trim());
          if (!result) {
            notify('Choose a precise meeting location so nearby activities can be shown correctly.', 'error');
            return;
          }
          coordinates = { latitude: result.lat, longitude: result.lon };
        } catch (error) {
          notify(error instanceof Error ? error.message : 'Unable to locate this meeting place.', 'error');
          return;
        }
      }

      await onSubmit({
        ...formData,
        categoryId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      onClose();
    } catch {
      // The caller reports API errors through the shared toast.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-100 my-auto overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-neutral-100 flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Host a New Plan
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Share details so people nearby can discover and join.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Plan Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-2">
              Plan Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              minLength={3}
              required
              placeholder="e.g. Sunday Morning Badminton Doubles"
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Category & Environment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  name="categoryId"
                  value={formData.categoryId || categories[0]?.id || ''}
                  onChange={(event) => setFormData((current) => ({ ...current, categoryId: Number(event.target.value) }))}
                  required
                  className="w-full appearance-none px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer pr-10"
                >
                  {categories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">
                Environment
              </label>
              <div className="relative">
                <select
                  name="environment"
                  value={formData.environment}
                  onChange={handleInputChange}
                  className="w-full appearance-none px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer pr-10"
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Description & Expectations */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-2">
              Description & Expectations <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Tell people what you are planning, what skill level is expected, what gear to bring, and how split costs will work..."
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
            />
          </div>

          {/* Meeting Location */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-2">
              Meeting Location <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  minLength={2}
                  required
                  placeholder="Venue name, landmark, and area (e.g. Play9 Arena, Indiranagar)"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsLocationPickerOpen(true)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition-colors hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <MapPinned className="h-4 w-4" />
                Choose on Map
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Choose on the map for the most accurate nearby activity recommendations.
            </p>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Participants Wanted Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFBF5] border border-[#FFE8CC] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                  Additional Participants Wanted
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Excluding yourself (Total group capacity: {formData.additionalParticipants + 1} people)
                </p>
              </div>

              {/* Counter Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrementCount}
                  className="w-8 h-8 rounded-xl border border-neutral-200 bg-white text-neutral-700 font-bold hover:bg-neutral-50 flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  -
                </button>
                <span className="text-base font-black text-rose-500 min-w-4 text-center">
                  {formData.additionalParticipants}
                </span>
                <button
                  type="button"
                  onClick={incrementCount}
                  className="w-8 h-8 rounded-xl border border-neutral-200 bg-white text-neutral-700 font-bold hover:bg-neutral-50 flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-amber-800/80 font-medium pt-1">
              <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <span>
                Example: You + {formData.additionalParticipants} joined members = {formData.additionalParticipants + 1} spots.
              </span>
            </div>
          </div>

          {/* Select Cover Photography */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-neutral-900">
              Select Cover Photography
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {COVER_OPTIONS.map((item) => {
                const isSelected = formData.coverImage === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, coverImage: item.url }))}
                    className={`relative h-20 sm:h-24 rounded-2xl overflow-hidden group cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-3 ring-orange-500 scale-[0.98]'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-white/25 backdrop-blur-xs border border-white flex items-center justify-center text-white">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Publishing…' : 'Publish Plan'}
            </button>
          </div>
        </form>
      </div>
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