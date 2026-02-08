/**
 * LeaderboardRivalsSection - Core hook: shows player above, you, player below
 * Enhanced with connector lines, hover states, and polished animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Target, ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
  
  const initials = player.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const isCurrent = position === 'current';

  // Enhanced gap copy: "1 course to overtake" style
  const getGapLabel = () => {
    if (!gap || gap === 0) return null;
    const courseWord = gap === 1 ? 'course' : 'courses';
    if (position === 'above') {
      return `${gap} ${courseWord} to overtake`;
    }
    return `${gap} ${courseWord} ahead`;
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isCurrent}
      whileTap={!isCurrent ? { scale: 0.98 } : undefined}
      whileHover={!isCurrent ? { backgroundColor: 'rgba(0,0,0,0.04)' } : undefined}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group',
        isCurrent 
          ? 'bg-primary/[0.08] border-2 border-primary/25 shadow-sm z-10' 
          : 'hover:bg-muted/40',
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          isCurrent ? 'text-primary' : 'text-muted-foreground'
        )}>
          #{player.rank}
        </span>
      </div>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <SquircleAvatar
          size={isCurrent ? 44 : 40}
          src={player.avatar_url}
          alt={player.display_name}
          fallback={initials}
          thinRing
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p 
          className={cn(
            'text-sm font-medium truncate',
            isCurrent && 'font-semibold text-foreground'
          )}
          title={player.display_name}
        >
          {player.display_name}
          {isCurrent && <span className="text-primary font-medium ml-1">(You)</span>}
        </p>
        {player.home_club && (
          <p className="text-xs text-muted-foreground truncate" title={player.home_club}>
            {player.home_club}
          </p>
        )}
      </div>

      {/* Top 100 count + enhanced gap indicator */}
      <div className="flex-shrink-0 text-right">
        <p className={cn(
          'text-sm font-bold tabular-nums',
          isCurrent && 'text-lg'
        )}>
          {player.total_top100_played}
        </p>
        {gap !== undefined && gap > 0 && (
          <p className={cn(
            'text-[10px] font-medium',
            position === 'above' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          )}>
            {getGapLabel()}
          </p>
        )}
      </div>

      {/* Chevron for non-current rows */}
      {!isCurrent && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors flex-shrink-0" />
      )}
    </motion.button>
  );
}

// Connector line component with entrance animation
function ConnectorLine({ direction, delay = 0 }: { direction: 'up' | 'down'; delay?: number }) {
  return (
    <motion.div 
      className="flex justify-center py-0.5 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex flex-col items-center">
        {direction === 'up' && (
          <svg width="12" height="14" viewBox="0 0 12 14" className="text-muted-foreground/25">
            <path d="M6 14 L6 4 M2 7 L6 3 L10 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {direction === 'down' && (
          <svg width="12" height="14" viewBox="0 0 12 14" className="text-muted-foreground/25">
            <path d="M6 0 L6 10 M2 7 L6 11 L10 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </motion.div>
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

  // Motivational callout with enhanced copy
  const callout = gapAbove === 1 
    ? '🎯 Just 1 course away from climbing!' 
    : gapAbove > 0 && gapAbove <= 3 
      ? `🔥 ${gapAbove} courses to overtake and climb!`
      : null;

  return (
    <div className="mx-4 mt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-muted/50">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Your Rivals</h3>
        </div>
      </div>

      {/* Rivals stack with connector lines */}
      <div className="relative">
        {/* Vertical connector line behind cards */}
        <div className="absolute left-[2.75rem] top-0 bottom-0 w-px bg-gradient-to-b from-muted/0 via-muted/30 to-muted/0 pointer-events-none" />
        
        <div className="relative space-y-0">
          {/* Player above */}
          {playerAbove && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RivalRow 
                player={playerAbove} 
                position="above"
                gap={gapAbove}
                onClick={() => onViewRival?.(playerAbove.user_id)}
              />
              <ConnectorLine direction="up" delay={0.15} />
            </motion.div>
          )}

          {/* Current user - elevated centerpiece */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <RivalRow 
              player={currentUser} 
              position="current" 
            />
          </motion.div>

          {/* Player below */}
          {playerBelow && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ConnectorLine direction="down" delay={0.25} />
              <RivalRow 
                player={playerBelow} 
                position="below"
                gap={gapBelow}
                onClick={() => onViewRival?.(playerBelow.user_id)}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Motivational callout - polished styling */}
      {callout && (
        <motion.div 
          className="mt-3 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
            {callout}
          </p>
        </motion.div>
      )}

      {/* View full leaderboard CTA with hover animation */}
      {onViewLeaderboard && (
        <motion.button
          onClick={onViewLeaderboard}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-center group flex items-center justify-center gap-1"
        >
          <span>View full leaderboard</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      )}
    </div>
  );
}
