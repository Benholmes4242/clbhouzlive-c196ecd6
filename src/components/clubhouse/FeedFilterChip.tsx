import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClubhouseTab } from './ClubhouseTabToggle';

interface FeedFilterChipProps {
  activeTab: ClubhouseTab;
  isOpen: boolean;
  onClick: () => void;
  isBusinessActor?: boolean;
}

/**
 * FeedFilterChip - Amber-accented chip showing the active feed filter inside
 * the Clubhouse identity pill. Taps open a small dropdown with Suggested/Friends.
 */
export const FeedFilterChip = forwardRef<HTMLButtonElement, FeedFilterChipProps>(
  ({ activeTab, isOpen, onClick, isBusinessActor = false }, ref) => {
    const label = activeTab === 'foryou' ? 'Suggested' : 'Friends';

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={`Feed filter: ${label}${isBusinessActor ? '' : '. Tap to change.'}`}
        aria-haspopup={isBusinessActor ? undefined : 'listbox'}
        aria-expanded={isBusinessActor ? undefined : isOpen}
        disabled={isBusinessActor}
        className={cn(
          'flex items-center gap-1 flex-shrink-0',
          'rounded-full border',
          'transition-all duration-200',
          'active:scale-[0.97]',
          'font-bold whitespace-nowrap',
          isBusinessActor ? 'cursor-default' : 'cursor-pointer'
        )}
        style={{
          padding: '5px 10px 5px 11px',
          background:
            'linear-gradient(90deg, rgba(245,158,11,0.18) 0%, rgba(247,147,30,0.22) 100%)',
          borderColor: 'rgba(247, 147, 30, 0.38)',
          color: '#F7931E',
          fontFamily: 'Geist, system-ui, sans-serif',
          fontSize: 11,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        <span>{label}</span>
        {!isBusinessActor && (
          <ChevronDown
            size={11}
            strokeWidth={2.5}
            style={{
              color: '#F7931E',
              opacity: 0.85,
              marginLeft: 1,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s ease',
            }}
          />
        )}
      </button>
    );
  }
);

FeedFilterChip.displayName = 'FeedFilterChip';

export default FeedFilterChip;
