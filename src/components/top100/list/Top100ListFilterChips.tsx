import React from 'react';
import { Trophy, Star, Flame, Footprints } from 'lucide-react';
import { motion } from 'framer-motion';

export type Top100FilterChip = 'official' | 'highest-rated' | 'most-played' | 'unplayed';

interface FilterChipData {
  key: Top100FilterChip;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface Top100ListFilterChipsProps {
  activeFilter: Top100FilterChip;
  onFilterChange: (filter: Top100FilterChip) => void;
  counts?: Partial<Record<Top100FilterChip, number>>;
  isSticky?: boolean;
}

/**
 * Horizontal scrollable filter chips replacing dropdown selectors.
 * Intent-driven filters for Top 100 list browsing.
 */
export const Top100ListFilterChips: React.FC<Top100ListFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  counts = {},
  isSticky = false,
}) => {
  const chips: FilterChipData[] = [
    { 
      key: 'official', 
      label: 'Official Order', 
      icon: <Trophy className="w-3 h-3" />,
    },
    { 
      key: 'highest-rated', 
      label: 'Highest Rated', 
      icon: <Star className="w-3 h-3" />,
    },
    { 
      key: 'most-played', 
      label: 'Most Played', 
      icon: <Flame className="w-3 h-3" />,
    },
    { 
      key: 'unplayed', 
      label: 'Unplayed', 
      icon: <Footprints className="w-3 h-3" />,
      count: counts.unplayed,
    },
  ];

  return (
    <div 
      className={`py-3 transition-all ${
        isSticky 
          ? 'bg-gradient-to-b from-white via-white to-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' 
          : 'bg-background'
      }`}
    >
      {/* Section label above filters */}
      {!isSticky && (
        <div className="px-4 mb-2">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Browse the list
          </h3>
        </div>
      )}
      
      <div className="flex gap-2 overflow-x-auto pb-1 px-4 scrollbar-hide">
        {chips.map((chip) => {
          const isActive = activeFilter === chip.key;
          // Official Order is default and should appear filled
          const isDefault = chip.key === 'official';
          
          return (
            <motion.button
              key={chip.key}
              onClick={() => onFilterChange(chip.key)}
              whileTap={{ scale: 0.95 }}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-sq-pill whitespace-nowrap transition-all
                ${isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }
              `}
            >
              <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                {chip.icon}
              </span>
              <span>{chip.label}</span>
              {chip.count !== undefined && chip.count > 0 && (
                <span className={`
                  px-1.5 py-0.5 text-[10px] rounded-full
                  ${isActive ? 'bg-white/20 text-white/80' : 'bg-slate-100 text-slate-500'}
                `}>
                  {chip.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
