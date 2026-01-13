/**
 * LeaderboardYourStatus - Prominent "Your Status" card
 * Shows rank, tier, progress, and CTAs with animated progress bar
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, History } from 'lucide-react';
import { motion } from 'framer-motion';
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
  timeRange?: string; // e.g. "This Year", "This Month"
}

interface LeaderboardYourStatusProps {
  user: LeaderboardUserStatus;
  onViewRivals?: () => void;
  onViewHistory?: () => void;
  rivalsDisabled?: boolean;
  rivalsDisabledReason?: string;
  className?: string;
}

export function LeaderboardYourStatus({ 
  user, 
  onViewRivals,
  onViewHistory,
  rivalsDisabled = false,
  rivalsDisabledReason,
  className 
}: LeaderboardYourStatusProps) {
  const navigate = useNavigate();
  const [animatedProgress, setAnimatedProgress] = useState(0);
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

  // Build rank label with time range context
  let rankLabel = user.activeRegion 
    ? `#${displayRank} ${user.activeRegion}` 
    : `#${displayRank} Global`;
  
  if (user.timeRange) {
    rankLabel += ` (${user.timeRange})`;
  }

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPct);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPct]);

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
          </div>

          {/* Info block */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Your Rank
            </p>
            <motion.p 
              className="text-lg font-bold text-foreground mt-0.5"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {rankLabel}
            </motion.p>
            {club.tierName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {club.tierName}
              </p>
            )}
          </div>

          {/* Courses count */}
          <div className="text-right flex-shrink-0">
            <motion.p 
              className="text-2xl font-bold text-foreground"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {user.total_top100_played}
            </motion.p>
            <p className="text-[11px] text-muted-foreground">
              / 100
            </p>
          </div>
        </div>

        {/* Progress to next milestone with animation */}
        {nextClub && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">
                Next: <span className="font-medium text-foreground">{nextClub.tierName}</span>
              </span>
              <motion.span 
                className="text-muted-foreground font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {coursesAway} {coursesAway === 1 ? 'course' : 'courses'} away
              </motion.span>
            </div>
            <div 
              role="progressbar"
              aria-valuenow={Math.round(animatedProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress to ${nextClub.tierName}: ${user.total_top100_played} of ${nextClub.threshold} courses`}
              className="h-2 rounded-full bg-muted/40 overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${animatedProgress}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                style={{ 
                  background: `linear-gradient(90deg, ${ringColor}, ${ringColor}dd)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CTAs row with press effect */}
      <div className="flex border-t border-border/40">
        <motion.button
          onClick={rivalsDisabled ? undefined : onViewRivals}
          whileTap={rivalsDisabled ? undefined : { scale: 0.98 }}
          disabled={rivalsDisabled}
          title={rivalsDisabled ? rivalsDisabledReason : undefined}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-r border-border/40",
            rivalsDisabled 
              ? "text-muted-foreground/40 cursor-not-allowed" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <Target className="w-4 h-4" />
          Rivals
        </motion.button>
        <motion.button
          onClick={onViewHistory}
          whileTap={{ scale: 0.98 }}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-r border-border/40"
        >
          <History className="w-4 h-4" />
          History
        </motion.button>
        <motion.button
          onClick={() => navigate('/discover?tab=explore')}
          whileTap={{ scale: 0.98 }}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log
        </motion.button>
      </div>
    </div>
  );
}
