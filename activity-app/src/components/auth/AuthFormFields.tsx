"use client";

import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function AuthInput({
  label,
  icon,
  rightElement,
  className = '',
  ...props
}: AuthInputProps) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} ${
            rightElement ? 'pr-10' : 'pr-4'
          } py-3 bg-white/90 border border-neutral-200/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-neutral-800 placeholder-neutral-400 ${className}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}