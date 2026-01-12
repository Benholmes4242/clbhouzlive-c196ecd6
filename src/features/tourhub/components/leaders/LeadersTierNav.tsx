/**
 * LeadersTierNav - Premium segmented navigation for Leaders page
 * Tier 1: Season Performance tabs (pill segmented control)
 * Tier 2: Skill categories (horizontal scroll with fade edges)
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Tier 1 Categories (Season Performance)
export type SeasonCategory = 'world_rank' | 'events' | 'cuts' | 'top10' | 'earnings';

const SEASON_CATEGORIES: { id: SeasonCategory; label: string }[] = [
  { id: 'world_rank', label: 'World Rank' },
  { id: 'events', label: 'Events' },
  { id: 'cuts', label: 'Cuts' },
  { id: 'top10', label: 'Top 10s' },
  { id: 'earnings', label: 'Earnings' },
];

// Tier 2 Categories (Skill Stats)
export type SkillCategory = 'scoring' | 'distance' | 'accuracy' | 'gir' | 'putting' | 'sand' | 'scrambling';

const SKILL_CATEGORIES: { id: SkillCategory; label: string; group: string }[] = [
  { id: 'scoring', label: 'Scoring', group: 'Ball Striking' },
  { id: 'distance', label: 'Distance', group: 'Ball Striking' },
  { id: 'accuracy', label: 'Accuracy', group: 'Ball Striking' },
  { id: 'gir', label: 'GIR', group: 'Ball Striking' },
  { id: 'putting', label: 'Putting', group: 'Short Game' },
  { id: 'sand', label: 'Sand Save', group: 'Short Game' },
  { id: 'scrambling', label: 'Scrambling', group: 'Short Game' },
];

interface Tier1NavProps {
  active: SeasonCategory;
  onChange: (category: SeasonCategory) => void;
  className?: string;
}

export const LeadersTier1Nav: React.FC<Tier1NavProps> = ({
  active,
  onChange,
  className,
}) => {
  return (
    <div className={cn(
      "sticky top-[var(--header-h-mobile,44px)] z-20",
      "bg-white/75 dark:bg-background/75 backdrop-blur-md",
      "px-4 py-3",
      className
    )}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {SEASON_CATEGORIES.map((cat) => {
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={cn(
                "flex-shrink-0 rounded-sq-pill px-4 py-2 text-sm font-medium",
                "transition-all duration-200 ease-out",
                isActive ? [
                  "bg-white dark:bg-white/10",
                  "shadow-sm",
                  "ring-1 ring-slate-200 dark:ring-white/10",
                  "text-foreground",
                ] : [
                  "bg-slate-100 dark:bg-white/5",
                  "text-slate-600 dark:text-muted-foreground",
                  "hover:bg-slate-150 dark:hover:bg-white/8",
                ]
              )}
            >
              {cat.label}
              {/* Orange underline for active */}
              {isActive && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-brand-orange" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface Tier2NavProps {
  active: SkillCategory;
  onChange: (category: SkillCategory) => void;
  className?: string;
}

export const LeadersTier2Nav: React.FC<Tier2NavProps> = ({
  active,
  onChange,
  className,
}) => {
  return (
    <div className={cn(
      "relative",
      className
    )}>
      {/* Section label */}
      <div className="px-4 mb-2">
        <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
          Ball Striking & Short Game
        </span>
      </div>

      {/* Scroll container with fade edges */}
      <div className="relative">
        {/* Left fade mask */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-background to-transparent z-10 pointer-events-none" />
        
        {/* Right fade mask */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-background to-transparent z-10 pointer-events-none" />

        <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 py-1">
          {SKILL_CATEGORIES.map((cat) => {
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onChange(cat.id)}
                className={cn(
                  "relative flex-shrink-0 px-3 py-2 text-sm",
                  "transition-all duration-200 ease-out",
                  isActive ? [
                    "font-semibold text-slate-900 dark:text-foreground",
                  ] : [
                    "text-slate-500 dark:text-muted-foreground",
                    "hover:text-slate-700 dark:hover:text-foreground/80",
                  ]
                )}
              >
                {cat.label}
                
                {/* Animated underline */}
                <div className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-brand-orange",
                  "transition-all duration-200 ease-out",
                  isActive ? "w-6 opacity-100" : "w-0 opacity-0"
                )} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { SEASON_CATEGORIES, SKILL_CATEGORIES };
