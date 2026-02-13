/**
 * LiveBadge - Green pulsing "LIVE" pill badge
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  className?: string;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        className
      )}
      style={{
        background: 'rgba(34, 197, 94, 0.15)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: '#22c55e',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      <span
        className="text-[10px] font-bold tracking-wider"
        style={{ color: '#16a34a' }}
      >
        LIVE
      </span>
    </div>
  );
};
