/**
 * LeaderboardYourStatus - Prominent "Your Status" card
 * Shows rank, tier, progress, and CTAs
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Target } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { cn } from '@/lib/utils';

export interface LeaderboardUserStatus {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_top100_played: number;
  rank: number;
  region_rank?: number;
  activeRegion?: string;
}

interface LeaderboardYourStatusProps {
  user: LeaderboardUserStatus;
  onViewRivals?: () => void;
  className?: string;
}

export function LeaderboardYourStatus({ 
  user, 
  onViewRivals,
  className 
}: LeaderboardYourStatusProps) {
  const navigate = useNavigate();
  const club = getTop100Club(user.total_top100_played);
  const nextClub = getNextTop100Club(user.total_top100_played);
  const ringColor = getRingColorForTotalPlayed(user.total_top100_played);

  const initials = user.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Progress to next milestone
  const progressPct = nextClub
    ? Math.min(100, (user.total_top100_played / nextClub.threshold) * 100)
    : 100;

  const coursesAway = nextClub 
    ? nextClub.threshold - user.total_top100_played 
    : 0;

  const displayRank = user.activeRegion && user.region_rank 
    ? user.region_rank 
    : user.rank;

  const rankLabel = user.activeRegion 
    ? `#${displayRank} ${user.activeRegion}` 
    : `#${displayRank} Global`;

  return (
    <div 
      className={cn(
        'mx-4 mt-4 rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-card/95 to-card/80',
        'border border-border/60',
        'shadow-lg shadow-black/5',
        className
      )}
    >
      {/* Main content */}
      <div className="p-4">
        {/* Top row: Avatar + Info */}
        <div className="flex items-start gap-3.5">
          {/* Avatar with XP ring */}
          <div className="relative flex-shrink-0">
            <SquircleAvatar
              size={56}
              src={user.avatar_url}
              alt={user.display_name}
              fallback={initials}
              ringColor={ringColor}
            />
            {/* XP progress ring overlay (simplified) */}
            <svg 
              className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]"
              viewBox="0 0 72 72"
            >
              <circle
                cx="36"
                cy="36"
                r="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted/20"
              />
              <circle
                cx="36"
                cy="36"
                r="34"
                fill="none"
                stroke={ringColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${(progressPct / 100) * 213.6} 213.6`}
                transform="rotate(-90 36 36)"
                className="transition-all duration-500"
              />
            </svg>
          </div>

          {/* Info block */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Your Rank
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {rankLabel}
            </p>
            {club.tierName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {club.tierName}
              </p>
            )}
          </div>

          {/* Courses count */}
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-foreground">
              {user.total_top100_played}
            </p>
            <p className="text-[11px] text-muted-foreground">
              / 100
            </p>
          </div>
        </div>

        {/* Progress to next milestone */}
        {nextClub && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">
                Next: <span className="font-medium text-foreground">{nextClub.tierName}</span>
              </span>
              <span className="text-muted-foreground font-medium">
                {coursesAway} away
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${ringColor}, ${ringColor}dd)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CTAs row */}
      <div className="flex border-t border-border/40">
        <button
          onClick={onViewRivals}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-r border-border/40"
        >
          <Target className="w-4 h-4" />
          View Rivals
        </button>
        <button
          onClick={() => navigate('/top100?tab=courses')}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log a Course
        </button>
      </div>
    </div>
  );
}
