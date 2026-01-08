/**
 * LeaderboardArenaTabs - Competitive arena mode tabs with underline animation
 * Global Elite | Regional Wars | Friends League | Fast Climbers | Nearby Rivals
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Flag, Users, TrendingUp, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ArenaMode = 'global' | 'regional' | 'friends' | 'climbers' | 'nearby';

interface ArenaTab {
  id: ArenaMode;
  label: string;
  icon: React.ElementType;
  description: string;
}

const ARENA_TABS: ArenaTab[] = [
  { 
    id: 'global', 
    label: 'Global Elite', 
    icon: Globe,
    description: 'All-time Top 100 explorers worldwide'
  },
  { 
    id: 'regional', 
    label: 'Regional Wars', 
    icon: Flag,
    description: 'Compete within your chosen Top 100 region list'
  },
  { 
    id: 'friends', 
    label: 'Friends League', 
    icon: Users,
    description: 'Your private competition with friends'
  },
  { 
    id: 'climbers', 
    label: 'Fast Climbers', 
    icon: TrendingUp,
    description: 'Biggest movers this month'
  },
  { 
    id: 'nearby', 
    label: 'Nearby', 
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
      {/* Scrollable tabs with underline animation */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="inline-flex gap-2 pb-1 min-w-max">
          {ARENA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            const isDisabled = disabledModes.includes(tab.id);

            return (
              <motion.button
                key={tab.id}
                onClick={() => !isDisabled && onChange(tab.id)}
                disabled={isDisabled}
                whileTap={!isDisabled ? { scale: 0.97 } : undefined}
                className={cn(
                  'relative flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-colors',
                  'whitespace-nowrap',
                  isActive
                    ? 'text-white'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                  isDisabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {/* Animated background for active state */}
                {isActive && (
                  <motion.div
                    layoutId="arena-tab-bg"
                    className="absolute inset-0 bg-surface-slate rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </span>
              </motion.button>
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
            className="text-xs text-muted-foreground mt-2.5 px-1"
          >
            {activeTab.description}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ARENA_TABS };
