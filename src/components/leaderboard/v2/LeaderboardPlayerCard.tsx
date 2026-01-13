/**
 * LeaderboardPlayerCard - Premium player card for leaderboard list
 * Compact competitive design with avatar, badges, rank, and trend
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getTop100Club } from '@/lib/top100Club';
import { cn } from '@/lib/utils';

export interface LeaderboardPlayerEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  home_club?: string | null;
  total_top100_played: number;
  rank: number;
  delta_rank?: number | null; // For Fast Climbers
  highlighted_course?: string | null; // Last played Top 100
  badges?: string[]; // Achievement badge codes
}

interface LeaderboardPlayerCardProps {
  player: LeaderboardPlayerEntry;
  isCurrentUser?: boolean;
  showTrend?: boolean;
  onClick?: () => void;
}

// Medal styles for top 3
const MEDAL_STYLES: Record<number, { 
  bg: string; 
  border: string; 
  text: string;
  glow: string;
}> = {
  1: { 
    bg: 'bg-gradient-to-br from-amber-100 to-amber-200', 
    border: 'border-amber-400/60', 
    text: 'text-amber-700',
    glow: 'shadow-amber-200/50',
  },
  2: { 
    bg: 'bg-gradient-to-br from-slate-100 to-slate-200', 
    border: 'border-slate-400/60', 
    text: 'text-slate-600',
    glow: 'shadow-slate-200/50',
  },
  3: { 
    bg: 'bg-gradient-to-br from-orange-100 to-orange-200', 
    border: 'border-orange-400/60', 
    text: 'text-orange-600',
    glow: 'shadow-orange-200/50',
  },
};

export function LeaderboardPlayerCard({
  player,
  isCurrentUser = false,
  showTrend = false,
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
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 transition-all',
        'hover:bg-muted/30 active:bg-muted/40',
        isCurrentUser && 'bg-primary/[0.06]',
        isTop3 && 'py-4', // Extra padding for elite players
      )}
    >
      {/* Avatar with ring */}
      <div className="relative flex-shrink-0">
        <SquircleAvatar
          size={isTop3 ? 52 : 44}
          src={player.avatar_url}
          alt={player.display_name}
          fallback={initials}
          ringColor={ringColor}
        />
        {/* Elite glow for top 3 */}
        {isTop3 && (
          <div 
            className="absolute -inset-1 rounded-[16px] -z-10 blur-md opacity-40"
            style={{ backgroundColor: ringColor }}
          />
        )}
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
            <span className="text-xs text-muted-foreground">(You)</span>
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

      {/* Top 100 count */}
      <div className="flex-shrink-0 text-right mr-2">
        <p className={cn(
          'text-sm font-bold',
          isTop3 && 'text-base',
        )}>
          {player.total_top100_played}
        </p>
        {showTrend && player.delta_rank && player.delta_rank > 0 && (
          <div className="flex items-center justify-end gap-0.5 text-emerald-500 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-medium">↑{player.delta_rank}</span>
          </div>
        )}
      </div>

      {/* Rank badge */}
      <div className="flex-shrink-0">
        {isTop3 && medalStyle ? (
          <span className={cn(
            'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border shadow-lg',
            medalStyle.bg,
            medalStyle.border,
            medalStyle.text,
            medalStyle.glow,
          )}>
            {player.rank}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center min-w-[32px] h-7 rounded-full bg-muted/60 px-2 text-xs font-medium text-muted-foreground">
            #{player.rank}
          </span>
        )}
      </div>
    </button>
  );
}
