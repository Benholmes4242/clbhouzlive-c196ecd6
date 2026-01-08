/**
 * LeaderboardArenaTabs - Competitive arena mode tabs
 * Global Elite | Regional Wars | Friends League | Fast Climbers | Nearby Rivals
 */

import React from 'react';
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
    description: 'Compete within your region'
  },
  { 
    id: 'friends', 
    label: 'Friends League', 
    icon: Users,
    description: 'See how you rank among friends'
  },
  { 
    id: 'climbers', 
    label: 'Fast Climbers', 
    icon: TrendingUp,
    description: 'Rising stars over the past 30 days'
  },
  { 
    id: 'nearby', 
    label: 'Nearby', 
    icon: MapPin,
    description: 'Players near your location'
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
      {/* Scrollable tabs */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="inline-flex gap-2 pb-1 min-w-max">
          {ARENA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            const isDisabled = disabledModes.includes(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onChange(tab.id)}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all',
                  'whitespace-nowrap',
                  isActive
                    ? 'bg-surface-slate text-white shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                  isDisabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tab description */}
      {activeTab && (
        <p className="text-xs text-muted-foreground mt-2.5 px-1">
          {activeTab.description}
        </p>
      )}
    </div>
  );
}

export { ARENA_TABS };
