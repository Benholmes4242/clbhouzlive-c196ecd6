/**
 * LeaderboardRivalsSection - Core hook: shows player above, you, player below
 * Displays the gap in Top 100 count with motivational callouts
 */

import React from 'react';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { cn } from '@/lib/utils';

export interface RivalPlayer {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_top100_played: number;
  rank: number;
  home_club?: string | null;
}

interface LeaderboardRivalsSectionProps {
  playerAbove: RivalPlayer | null;
  currentUser: RivalPlayer;
  playerBelow: RivalPlayer | null;
  onViewLeaderboard?: () => void;
  onViewRival?: (userId: string) => void;
}

function RivalRow({ 
  player, 
  position,
  gap,
  onClick,
}: { 
  player: RivalPlayer; 
  position: 'above' | 'current' | 'below';
  gap?: number;
  onClick?: () => void;
}) {
  const ringColor = getRingColorForTotalPlayed(player.total_top100_played);
  const initials = player.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const isCurrent = position === 'current';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCurrent}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
        isCurrent 
          ? 'bg-primary/[0.08] border border-primary/20' 
          : 'hover:bg-muted/40 active:scale-[0.99]',
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        <span className={cn(
          'text-sm font-bold',
          isCurrent ? 'text-primary' : 'text-muted-foreground'
        )}>
          #{player.rank}
        </span>
      </div>

      {/* Avatar */}
      <SquircleAvatar
        size={40}
        src={player.avatar_url}
        alt={player.display_name}
        fallback={initials}
        ringColor={ringColor}
        className="flex-shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className={cn(
          'text-sm font-medium truncate',
          isCurrent && 'font-semibold'
        )}>
          {player.display_name}
          {isCurrent && <span className="text-muted-foreground font-normal"> (You)</span>}
        </p>
        {player.home_club && (
          <p className="text-xs text-muted-foreground truncate">
            {player.home_club}
          </p>
        )}
      </div>

      {/* Top 100 count + gap indicator */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold">
          {player.total_top100_played}
        </p>
        {gap !== undefined && gap > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {position === 'above' ? `${gap} ahead` : `${gap} behind`}
          </p>
        )}
      </div>
    </button>
  );
}

export function LeaderboardRivalsSection({
  playerAbove,
  currentUser,
  playerBelow,
  onViewLeaderboard,
  onViewRival,
}: LeaderboardRivalsSectionProps) {
  const gapAbove = playerAbove 
    ? playerAbove.total_top100_played - currentUser.total_top100_played 
    : 0;
  
  const gapBelow = playerBelow 
    ? currentUser.total_top100_played - playerBelow.total_top100_played 
    : 0;

  // Motivational callout
  const callout = gapAbove === 1 
    ? 'Next jump within reach — 1 more Top 100!' 
    : gapAbove > 0 && gapAbove <= 3 
      ? `Overtake with ${gapAbove} more Top 100s`
      : null;

  return (
    <div className="mx-4 mt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Your Rivals</h3>
        </div>
      </div>

      {/* Rivals stack */}
      <div className="space-y-1.5">
        {/* Player above */}
        {playerAbove && (
          <>
            <RivalRow 
              player={playerAbove} 
              position="above"
              gap={gapAbove}
              onClick={() => onViewRival?.(playerAbove.user_id)}
            />
            <div className="flex justify-center py-0.5">
              <ChevronUp className="w-4 h-4 text-muted-foreground/40" />
            </div>
          </>
        )}

        {/* Current user */}
        <RivalRow 
          player={currentUser} 
          position="current" 
        />

        {/* Player below */}
        {playerBelow && (
          <>
            <div className="flex justify-center py-0.5">
              <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            </div>
            <RivalRow 
              player={playerBelow} 
              position="below"
              gap={gapBelow}
              onClick={() => onViewRival?.(playerBelow.user_id)}
            />
          </>
        )}
      </div>

      {/* Motivational callout */}
      {callout && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
            {callout}
          </p>
        </div>
      )}

      {/* View full leaderboard CTA */}
      {onViewLeaderboard && (
        <button
          onClick={onViewLeaderboard}
          className="w-full mt-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          View full leaderboard →
        </button>
      )}
    </div>
  );
}
