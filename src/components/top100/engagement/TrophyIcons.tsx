import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Globe, Flag, Star, Compass } from 'lucide-react';

export type BadgeType = 
  | 'top_rater_month'
  | 'played_4_regions'
  | 'completed_global'
  | 'rated_this_week'
  | 'active_today';

interface TrophyIconsProps {
  badges?: BadgeType[];
  maxIcons?: number;
  className?: string;
}

const BADGE_CONFIG: Record<BadgeType, { icon: typeof Trophy; label: string; activeColor: string }> = {
  top_rater_month: {
    icon: Trophy,
    label: 'Top Rater this month',
    activeColor: 'text-amber-500',
  },
  played_4_regions: {
    icon: Globe,
    label: 'Played 4 regions',
    activeColor: 'text-emerald-500',
  },
  completed_global: {
    icon: Flag,
    label: 'Completed Global Top 100',
    activeColor: 'text-blue-500',
  },
  rated_this_week: {
    icon: Compass,
    label: 'Rated a course this week',
    activeColor: 'text-purple-500',
  },
  active_today: {
    icon: Star,
    label: 'Active today',
    activeColor: 'text-orange-500',
  },
};

export function TrophyIcons({ badges = [], maxIcons = 2, className }: TrophyIconsProps) {
  if (badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxIcons);

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {displayBadges.map((badge) => {
        const config = BADGE_CONFIG[badge];
        if (!config) return null;
        
        const Icon = config.icon;
        
        return (
          <div
            key={badge}
            title={config.label}
            className={cn(
              'w-4 h-4 flex items-center justify-center',
              config.activeColor
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        );
      })}
    </div>
  );
}

// Helper to parse badges from JSONB
export function parseBadgesFromJson(badgesJson: unknown): BadgeType[] {
  if (!Array.isArray(badgesJson)) return [];
  return badgesJson.filter((b): b is BadgeType => 
    typeof b === 'string' && b in BADGE_CONFIG
  );
}
