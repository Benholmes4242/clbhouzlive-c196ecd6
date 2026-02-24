/**
 * LeaderboardArenaTabs - Tab navigation matching header style
 * Global Elite | Regional Wars | Friends League | Most Active | Nearby
 * Tier 1: Dark fill, switches entire view
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Flag, Users, TrendingUp, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ArenaMode = 'global' | 'regional' | 'friends' | 'climbers' | 'nearby';

interface ArenaTab {
  id: ArenaMode;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
}

const ARENA_TABS: ArenaTab[] = [
  { 
    id: 'global', 
    label: 'Global Elite', 
    shortLabel: 'Global',
    icon: Globe,
    description: 'All-time Top 100 explorers worldwide'
  },
  { 
    id: 'regional', 
    label: 'Regional Wars', 
    shortLabel: 'Regional',
    icon: Flag,
    description: 'Compete within your chosen Top 100 region list'
  },
  { 
    id: 'friends', 
    label: 'Friends League', 
    shortLabel: 'Friends',
    icon: Users,
    description: 'Your private competition with friends'
  },
  { 
    id: 'climbers', 
    label: 'Most Active', 
    shortLabel: 'Active',
    icon: TrendingUp,
    description: 'Players logging the most Top 100 courses this month'
  },
  { 
    id: 'nearby', 
    label: 'Nearby', 
    shortLabel: 'Nearby',
    icon: MapPin,
    description: 'Within 50 miles of your home club'
  },
];

interface LeaderboardArenaTabsProps {
  activeMode: ArenaMode;
  onChange: (mode: ArenaMode) => void;
  disabledModes?: ArenaMode[];
}

export function LeaderboardArenaTabs({
  activeMode,
  onChange,
  disabledModes = [],
}: LeaderboardArenaTabsProps) {
  const activeTab = ARENA_TABS.find(t => t.id === activeMode);

  return (
    <div className="w-full">
      {/* Scrollable tabs - Tier 1 dark fill */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div 
          role="tablist" 
          aria-label="Leaderboard views"
          className="inline-flex gap-1 min-w-max"
        >
          {ARENA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            const isDisabled = disabledModes.includes(tab.id);

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`leaderboard-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => !isDisabled && onChange(tab.id)}
                disabled={isDisabled}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                  'whitespace-nowrap',
                  isActive
                    ? 'bg-foreground text-background font-semibold'
                    : 'text-muted-foreground hover:text-foreground bg-transparent',
                  isDisabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {/* Full label on larger screens, short on mobile */}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tab description with fade animation */}
      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.p 
            key={activeTab.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-muted-foreground mt-3 text-center"
          >
            {activeTab.description}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ARENA_TABS };
