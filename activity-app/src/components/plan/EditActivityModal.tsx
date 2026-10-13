"use client";

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Info, 
  Check, 
  ChevronDown 
} from 'lucide-react';

export interface EditPlanData {
  id: string;
  title: string;
  category: string;
  environment: 'Indoor' | 'Outdoor';
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  additionalParticipants: number;
  coverImage: string;
}

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: EditPlanData | null;
  onSave?: (updatedPlan: EditPlanData) => void;
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

export function EditActivityModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: EditActivityModalProps) {
  const [formData, setFormData] = useState<EditPlanData>(() => initialData ?? {
    id: '',
    title: '',
    category: 'Sports',
    environment: 'Indoor',
    description: '',
    location: '',
    date: '2026-10-25',
    startTime: '05:30',
    endTime: '11:00',
    additionalParticipants: 3,
    coverImage: COVER_OPTIONS[1].url,
  });

  if (!isOpen || !initialData) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide an activity title');
      return;
    }
    onSave?.(formData);
    onClose();
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
              Edit Activity
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Update plan details, timing, or available spots for participants.
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
              placeholder="e.g. Sunrise Trek to Savandurga Monolith"
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
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full appearance-none px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer pr-10"
                >
                  <option value="Outdoor Adventures">Outdoor Adventures</option>
                  <option value="Sports">Sports</option>
                  <option value="Social Meetups">Social Meetups</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Food & Drinks">Food & Drinks</option>
                  <option value="Study & Work">Study & Work</option>
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
                  <option value="Outdoor">Outdoor</option>
                  <option value="Indoor">Indoor</option>
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
              placeholder="Tell people what you are planning, meeting spots, rules..."
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
            />
          </div>

          {/* Meeting Location */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-2">
              Meeting Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Savandurga Base Camp (Meeting: Silk Board)"
                className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Additional Participants Counter */}
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
              Update Cover Photography
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

          {/* Modal Footer Actions */}
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
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}