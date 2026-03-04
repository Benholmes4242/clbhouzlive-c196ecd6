/**
 * FeedTabToggle — matches ClubhouseTabToggle exactly.
 * Plain text with | separator, no pill background.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import type { FeedTab } from './types/media';

interface FeedTabToggleProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  className?: string;
}

export function FeedTabToggle({ activeTab, onTabChange, className }: FeedTabToggleProps) {
  return (
    <div
      className={cn('flex items-center gap-2 relative z-[45]', className)}
      role="tablist"
      aria-label="Feed filter"
    >
      <button
        role="tab"
        aria-selected={activeTab === 'suggested'}
        onClick={(e) => {
          e.stopPropagation();
          onTabChange('suggested');
        }}
        className={cn(
          'text-sm transition-all duration-200 whitespace-nowrap py-3 px-1 active:scale-[0.97]',
          activeTab === 'suggested'
            ? 'text-white opacity-100 font-semibold'
            : 'text-white opacity-50 font-medium'
        )}
      >
        Suggested
      </button>
      <span className="text-white opacity-40 text-sm font-light" aria-hidden="true">|</span>
      <button
        role="tab"
        aria-selected={activeTab === 'friends'}
        onClick={(e) => {
          e.stopPropagation();
          onTabChange('friends');
        }}
        className={cn(
          'text-sm transition-all duration-200 whitespace-nowrap py-3 px-1 active:scale-[0.97]',
          activeTab === 'friends'
            ? 'text-white opacity-100 font-semibold'
            : 'text-white opacity-50 font-medium'
        )}
      >
        Friends
      </button>
    </div>
  );
}
