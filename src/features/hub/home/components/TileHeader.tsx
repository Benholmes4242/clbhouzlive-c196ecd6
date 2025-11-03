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
          <h3 
            className="text-[20px] font-semibold leading-snug truncate tracking-[-0.01em]"
            style={{ color: 'var(--hub-text)' }}
          >
            {title}
          </h3>
          {subtitle && (
            <p 
              className="text-[13px] leading-tight truncate mt-0.5"
              style={{ color: 'var(--hub-text-sub)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="shrink-0 px-3.5 py-2.5 rounded-2xl backdrop-blur text-[13px] font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              border: '1px solid var(--hub-stroke-subtle)',
              background: 'transparent',
              color: 'var(--hub-text)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-subtle)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            View all →
          </button>
        )}
      </div>
    </div>
  );
}
