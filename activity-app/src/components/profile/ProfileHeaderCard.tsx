"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, MapPin, UserCheck, UserPlus } from 'lucide-react';

import Swal from 'sweetalert2';
import { ApiError } from '@/service/AuthService';
import {
  addBuddy,
  getBuddyStatus,
  removeBuddy,
} from '@/service/buddyService';
import { useAuth } from '../auth/AuthProvider';
import { resolveMediaUrl } from '@/service/mediaService';

interface ProfileHeaderCardProps {
  name?: string;
  location?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  onEditProfile?: () => void;
  onAvatarUpload?: (file: File) => void | Promise<void>;
  isAvatarUploading?: boolean;
  userId?: string;
  isOwnProfile?: boolean;
  onBuddyChange?: (isBuddy: boolean) => void;
  showEditButton?: boolean;
  showAvatarUpload?: boolean;
  showEmail?: boolean;
}

export function ProfileHeaderCard({
  name = 'Aryan Sharma',
  location = 'Indiranagar, Bangalore',
  email = 'aryan.sharma@example.com',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  bio = 'Product designer & weekend trail runner. Always up for badminton, filter coffee, or strategy board games!',
  onEditProfile,
  onAvatarUpload,
  isAvatarUploading = false,
  userId,
  isOwnProfile = false,
  onBuddyChange,
  showEditButton = true,
  showAvatarUpload = true,
  showEmail = true,
}: ProfileHeaderCardProps) {
  const { notify } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [buddyStatus, setBuddyStatus] = useState<{
    userId: string;
    isBuddy: boolean;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isBuddy = Boolean(
    userId && buddyStatus?.userId === userId && buddyStatus.isBuddy,
  );
  const isLoadingStatus = Boolean(userId && buddyStatus?.userId !== userId);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      return () => {
        cancelled = true;
      };
    }

    getBuddyStatus(userId)
      .then((status) => {
        if (!cancelled) {
          setBuddyStatus({ userId, isBuddy: status.is_buddy });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setBuddyStatus({ userId, isBuddy: false });
          notify(
            error instanceof ApiError ? error.message : 'Something went wrong',
            'error',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [notify, userId]);

  const handleBuddyToggle = async () => {
    if (!userId || isLoadingStatus || isProcessing) return;

    setIsProcessing(true);
    try {
      if (isBuddy) {
        const result = await Swal.fire({
          title: 'Remove buddy?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, remove',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#dc2626',
          reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        await removeBuddy(userId);
        setBuddyStatus({ userId, isBuddy: false });
        onBuddyChange?.(false);
        notify(`${name} removed from your buddies`, 'success');
      } else {
        await addBuddy(userId);
        setBuddyStatus({ userId, isBuddy: true });
        onBuddyChange?.(true);
        notify(`${name} added as your buddy`, 'success');
      }
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : 'Something went wrong',
        'error',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const showBuddyButton = !isOwnProfile && Boolean(userId);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-2xs space-y-6">
      {/* Top Details Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        
        {/* Avatar & User Details */}
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Badge */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-sm">
              {avatarUrl ? (
                <img
                  src={resolveMediaUrl(avatarUrl)}
                  alt={name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-700">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            {showAvatarUpload && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Choose profile photo"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onAvatarUpload?.(file);
                    event.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isAvatarUploading}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-neutral-900 border-2 border-white flex items-center justify-center text-white hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer disabled:cursor-wait disabled:opacity-70"
                  title="Change photo"
                  aria-label="Change profile photo"
                >
                  {isAvatarUploading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Camera className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
          </div>

          {/* User Name & Metadata */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              {name}
            </h1>
            
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span>{location}</span>
            </div>

            {showEmail && <p className="text-xs text-neutral-400">{email}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {showBuddyButton && (
            <button
              type="button"
              onClick={() => void handleBuddyToggle()}
              disabled={isLoadingStatus || isProcessing}
              className={isBuddy
                ? 'px-5 py-2 rounded-full border border-neutral-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-neutral-800 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
                : 'px-5 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'}
            >
              {isLoadingStatus || isProcessing ? (
                <Loader2 className="inline-block w-4 h-4 animate-spin" aria-label="Loading" />
              ) : isBuddy ? (
                <UserCheck className="inline-block w-4 h-4 mr-1.5" />
              ) : (
                <UserPlus className="inline-block w-4 h-4 mr-1.5" />
              )}
              {isBuddy ? 'Remove Buddy' : 'Add Buddy'}
            </button>
          )}
          {showEditButton && (
            <button
              type="button"
              onClick={onEditProfile}
              className="px-5 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer self-start sm:self-center"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Bio Section */}
      <div className="pt-2 border-t border-neutral-100">
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
          {bio}
        </p>
      </div>
    </div>
  );
}