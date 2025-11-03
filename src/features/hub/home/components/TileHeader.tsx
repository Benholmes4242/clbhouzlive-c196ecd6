/**
 * TileHeader Component
 * Apple-style tile header with perfect text hierarchy
 */

import React from 'react';

interface TileHeaderProps {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}

export function TileHeader({ title, subtitle, onViewAll }: TileHeaderProps) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-semibold leading-snug text-white truncate tracking-[-0.01em]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[13px] leading-tight text-white/65 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="shrink-0 px-3.5 py-2.5 rounded-2xl border border-white/14 bg-white/06 backdrop-blur text-[13px] font-medium text-white hover:bg-white/12 transition-all duration-200 whitespace-nowrap"
          >
            View all →
          </button>
        )}
      </div>
    </div>
  );
}
