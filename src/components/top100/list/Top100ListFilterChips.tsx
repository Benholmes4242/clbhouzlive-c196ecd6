import React, { useState } from 'react';
import { ChevronDown, ListOrdered, Users, CheckCircle2, Circle } from 'lucide-react';
import { Top100FilterSheet } from './Top100FilterSheet';

export type Top100FilterChip = 'official' | 'community' | 'played' | 'unplayed';

interface Top100ListFilterChipsProps {
  activeFilter: Top100FilterChip;
  onFilterChange: (filter: Top100FilterChip) => void;
  counts?: Partial<Record<Top100FilterChip, number>>;
  isSticky?: boolean;
}

const FILTER_LABELS: Record<Top100FilterChip, { label: string; icon: React.ReactNode }> = {
  official: { label: 'Official', icon: <ListOrdered className="w-4 h-4" /> },
  community: { label: 'Community', icon: <Users className="w-4 h-4" /> },
  played: { label: 'Played', icon: <CheckCircle2 className="w-4 h-4" /> },
  unplayed: { label: 'Unplayed', icon: <Circle className="w-4 h-4" /> },
};

/**
 * Filter trigger that opens a bottom sheet selector.
 * Replaces the previous tab bar for a cleaner, mobile-friendly UX.
 */
export const Top100ListFilterChips: React.FC<Top100ListFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  counts = {},
  isSticky = false,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const current = FILTER_LABELS[activeFilter];
  const count = counts[activeFilter];

  return (
    <>
      <div 
        className={`px-4 py-3 transition-all ${
          isSticky 
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm' 
            : 'bg-slate-50 border-b border-slate-200/60'
        }`}
      >
        <button
          onClick={() => setIsSheetOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
        >
          <span className="text-slate-500">{current.icon}</span>
          <span className="text-sm font-medium text-slate-800">
            Filter · {current.label}
            {count !== undefined && count > 0 && (
              <span className="text-slate-400 ml-1">({count})</span>
            )}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <Top100FilterSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        counts={counts}
      />
    </>
  );
};
