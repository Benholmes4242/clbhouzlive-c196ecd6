/**
 * LeaderboardPlayerCard - Premium player card for leaderboard list
 * Compact competitive design with avatar, badges, rank, and trend
 * Enhanced with hover states, top 3 glow, and polished animations
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/clbhouzAchievementPalette';
import { getTop100Club } from '@/lib/top100Club';
import { cn } from '@/lib/utils';

export interface LeaderboardPlayerEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  home_club?: string | null;
  total_top100_played: number;
  rank: number;
  delta_rank?: number | null; // For Fast Climbers (future: true rank delta)
  courses_logged_recently?: number | null; // For Most Active tab
  highlighted_course?: string | null; // Last played Top 100
  badges?: string[]; // Achievement badge codes
}

interface LeaderboardPlayerCardProps {
  player: LeaderboardPlayerEntry;
  isCurrentUser?: boolean;
  showTrend?: boolean;
  showRecentActivity?: boolean; // For "Most Active" tab
  onClick?: () => void;
}

// Medal styles for top 3 with enhanced shimmer
const MEDAL_STYLES: Record<number, { 
  bg: string; 
  border: string; 
  text: string;
  glow: string;
  rowBg: string;
}> = {
  1: { 
    bg: 'bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-300', 
    border: 'border-amber-400/70', 
    text: 'text-amber-800',
    glow: 'shadow-lg shadow-amber-300/40',
    rowBg: 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20',
  },
  2: { 
    bg: 'bg-gradient-to-br from-slate-200 via-gray-100 to-slate-300', 
    border: 'border-slate-400/60', 
    text: 'text-slate-700',
    glow: 'shadow-lg shadow-slate-300/30',
    rowBg: 'bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-950/20',
  },
  3: { 
    bg: 'bg-gradient-to-br from-orange-200 via-amber-100 to-orange-300', 
    border: 'border-orange-400/60', 
    text: 'text-orange-700',
    glow: 'shadow-lg shadow-orange-300/30',
    rowBg: 'bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20',
  },
};

export function LeaderboardPlayerCard({
  player,
  isCurrentUser = false,
  showTrend = false,
  showRecentActivity = false,
  onClick,
}: LeaderboardPlayerCardProps) {
  const navigate = useNavigate();
  const club = getTop100Club(player.total_top100_played);
  const ringColor = getRingColorForTotalPlayed(player.total_top100_played);
  
  const isTop3 = player.rank >= 1 && player.rank <= 3;
  const medalStyle = MEDAL_STYLES[player.rank];

  const initials = player.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/profile/${player.user_id}?tab=top100`);
    }
  };

  // Build subline: home club + highlighted course
  const subline = [
    player.home_club,
    player.highlighted_course && `★ ${player.highlighted_course}`,
  ].filter(Boolean).join(' · ');

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.995 }}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 transition-all group',
        'hover:bg-muted/30 active:bg-muted/40',
        isCurrentUser && 'bg-primary/[0.06] hover:bg-primary/[0.08]',
        isTop3 && 'py-4',
        isTop3 && medalStyle?.rowBg,
      )}
    >
      {/* Avatar with ring */}
      <div className="relative flex-shrink-0">
        {/* Glow effect for top 3 */}
        {isTop3 && (
          <motion.div 
            className="absolute -inset-1.5 rounded-[18px] -z-10 blur-md opacity-40"
            style={{ backgroundColor: ringColor }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}
        {/* Hover glow for non-top3 */}
        <div 
          className={cn(
            "absolute -inset-0.5 rounded-[14px] -z-10 blur-sm opacity-0 transition-opacity",
            !isTop3 && "group-hover:opacity-30"
          )}
          style={{ backgroundColor: ringColor }}
        />
        <SquircleAvatar
          size={isTop3 ? 52 : 44}
          src={player.avatar_url}
          alt={player.display_name}
          fallback={initials}
          ringColor={ringColor}
        />
      </div>

      {/* Info block */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span 
            className={cn(
              'text-sm font-medium truncate',
              isCurrentUser && 'font-semibold',
              isTop3 && 'text-[15px] font-semibold',
            )}
            title={player.display_name}
          >
            {player.display_name}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-primary/70 font-medium">(You)</span>
          )}
        </div>
        
        {subline && (
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={subline}>
            {subline}
          </p>
        )}
        
        {/* Badge row (achievement indicators) */}
        {player.badges && player.badges.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {player.badges.slice(0, 3).map((badge, i) => (
              <div 
                key={i}
                className="w-4 h-4 rounded-full bg-muted/60 flex items-center justify-center"
                title={badge}
              >
                <Award className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
            ))}
            {player.badges.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{player.badges.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Top 100 count / Recent activity */}
      <div className="flex-shrink-0 text-right mr-2">
        {showRecentActivity && player.courses_logged_recently ? (
          // Most Active mode: show recent activity prominently with flame
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-sm font-bold tabular-nums">+{player.courses_logged_recently}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              this month
            </p>
          </div>
        ) : (
          // Standard mode: show total count
          <>
            <p className={cn(
              'text-sm font-bold tabular-nums',
              isTop3 && 'text-base',
            )}>
              {player.total_top100_played}
            </p>
            {showTrend && player.delta_rank && player.delta_rank > 0 && (
              <div className="flex items-center justify-end gap-0.5 text-emerald-500 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-medium tabular-nums">↑{player.delta_rank}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rank badge */}
      <div className="flex-shrink-0">
        {isTop3 && medalStyle ? (
          <motion.span 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: player.rank * 0.05 }}
            className={cn(
              'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border',
              medalStyle.bg,
              medalStyle.border,
              medalStyle.text,
              medalStyle.glow,
            )}
          >
            {player.rank}
          </motion.span>
        ) : (
          <span 
            className="inline-flex items-center justify-center min-w-[32px] h-7 rounded-full bg-muted/50 px-2 text-xs font-medium text-muted-foreground tabular-nums"
            aria-label={`Rank ${player.rank}`}
          >
            #{player.rank}
          </span>
        )}
      </div>
    </motion.button>
  );
}
