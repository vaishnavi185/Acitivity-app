"use client";

import React from 'react';

export interface StatCardProps {
  label: string;
  count: number | string;
  isHighlighted?: boolean;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export function StatCard({
  label,
  count,
  isHighlighted = false,
  className = '',
  onClick,
  isSelected = false,
}: StatCardProps) {
  const content = (
    <>
      <span className="text-xs font-medium text-neutral-500 leading-tight">
        {label}
      </span>
      <span
        className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${
          isHighlighted ? 'text-orange-600' : 'text-neutral-900'
        }`}
      >
        {count}
      </span>
    </>
  );

  const classNames = `bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs ${
    isSelected ? 'ring-2 ring-orange-500 border-orange-200' : ''
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        className={`${classNames} w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={classNames}>{content}</div>
  );
}