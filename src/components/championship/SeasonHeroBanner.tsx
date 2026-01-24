import React from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Trophy, Sun, Leaf, Snowflake, Zap, LucideIcon } from 'lucide-react';

interface SeasonHeroBannerProps {
  seasonName: string;
  seasonTagline: string;
  seasonId?: 'pre-season' | 'major' | 'summer' | 'off-season' | string;
  daysRemaining: number;
  totalDays: number;
  seasonColor?: string;
}

type SeasonConfig = {
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  iconColor: string;
  ringColor: string;
};

const SEASON_CONFIG: Record<string, SeasonConfig> = {
  'pre-season': {
    icon: Dumbbell,
    gradient: 'from-emerald-50 to-emerald-100/50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    ringColor: '#10B981',
  },
  'major': {
    icon: Trophy,
    gradient: 'from-amber-50 to-amber-100/50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    ringColor: '#F59E0B',
  },
  'summer': {
    icon: Sun,
    gradient: 'from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    ringColor: '#3B82F6',
  },
  'off-season': {
    icon: Leaf,
    gradient: 'from-purple-50 to-purple-100/50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    ringColor: '#8B5CF6',
  },
};

// Helper to detect season from name
function getSeasonConfigFromName(name: string): SeasonConfig {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('pre-season') || nameLower.includes('training')) {
    return SEASON_CONFIG['pre-season'];
  }
  if (nameLower.includes('major') || nameLower.includes('championship')) {
    return SEASON_CONFIG['major'];
  }
  if (nameLower.includes('summer') || nameLower.includes('open')) {
    return SEASON_CONFIG['summer'];
  }
  if (nameLower.includes('off-season') || nameLower.includes('fall') || nameLower.includes('winter')) {
    return SEASON_CONFIG['off-season'];
  }
  // Default
  return SEASON_CONFIG['pre-season'];
}

/**
 * SeasonHeroBanner - Hero section treatment for season header
 * 
 * Features:
 * - Soft gradient background (no heavy borders)
 * - SVG icons instead of emojis
 * - Circular progress ring for days remaining
 * - Consistent padding with page grid
 */
export const SeasonHeroBanner: React.FC<SeasonHeroBannerProps> = ({
  seasonName,
  seasonTagline,
  seasonId,
  daysRemaining,
  totalDays,
  seasonColor,
}) => {
  const config = seasonId && SEASON_CONFIG[seasonId] 
    ? SEASON_CONFIG[seasonId] 
    : getSeasonConfigFromName(seasonName);
  
  const Icon = config.icon;
  const ringColorFinal = seasonColor || config.ringColor;
  const progressPercent = totalDays > 0 
    ? ((totalDays - daysRemaining) / totalDays) * 100 
    : 0;

  return (
    <div className={cn(
      "relative px-4 py-5 rounded-xl",
      `bg-gradient-to-r ${config.gradient}`
    )}>
      <div className="flex items-center justify-between">
        {/* Left: Icon + Text */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            config.iconBg
          )}>
            <Icon className={cn("w-6 h-6", config.iconColor)} />
          </div>
          <div>
            <h2 className="text-lg font-bold">{seasonName}</h2>
            {seasonTagline && (
              <p className="text-sm text-muted-foreground">{seasonTagline}</p>
            )}
          </div>
        </div>

        {/* Right: Days Remaining Ring */}
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke={ringColorFinal}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercent / 100)}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold">{daysRemaining}</span>
            <span className="text-[10px] text-muted-foreground">days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonHeroBanner;
