"use client";

import React, { useEffect } from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'success',
  onClose,
  duration = 4000
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 border ${
        type === 'success'
          ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-500/10'
          : 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-500/10'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      ) : (
        <ShieldCheck className="w-5 h-5 text-rose-600 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}