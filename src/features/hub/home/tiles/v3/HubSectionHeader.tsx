/**
 * HubSectionHeader - Echo-styled section headers
 * Bold uppercase with green gradient accent line
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HubSectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function HubSectionHeader({ title, actionLabel, onAction }: HubSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      {/* Title with accent gradient line */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-bold tracking-[0.1em] uppercase"
          style={{ color: '#64748b' }}
        >
          {title}
        </span>
        <div
          className="h-[2px] w-8 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #22c55e 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Action link with Echo green */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-[13px] font-medium flex items-center gap-1 transition-colors active:opacity-70"
          style={{ color: '#22c55e' }}
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
