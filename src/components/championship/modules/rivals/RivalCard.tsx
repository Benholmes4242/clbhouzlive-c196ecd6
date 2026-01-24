import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Swords, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { RivalMomentumBadge, StatusRing } from '../../primitives';
import type { UserRival } from '@/types/championship';

interface RivalCardProps {
  rival: UserRival;
  divisionColor?: string;
  onViewProfile?: (userId: string) => void;
  onChallenge?: (userId: string) => void;
  className?: string;
}

/**
 * RivalCard - Detailed card for individual rival with head-to-head stats.
 */
export function RivalCard({ 
  rival, 
  divisionColor = '#6B7280',
  onViewProfile,
  onChallenge,
  className 
}: RivalCardProps) {
  const initials = rival.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const isAhead = rival.gap < 0; // negative gap = we're ahead
  const isBehind = rival.gap > 0;
  const gapAbs = Math.abs(rival.gap);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-2xl border bg-card',
        isBehind && 'border-red-200 dark:border-red-900/50',
        isAhead && 'border-emerald-200 dark:border-emerald-900/50',
        !isBehind && !isAhead && 'border-border',
        className
      )}
    >
      {/* Header with avatar and name */}
      <div className="flex items-start gap-3">
        <StatusRing 
          divisionSlug="rookie" 
          divisionColor={divisionColor}
          size="md"
        >
          <SquircleAvatar
            size={44}
            src={rival.avatar_url}
            alt={rival.display_name}
            fallback={initials}
          />
        </StatusRing>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground truncate">
                {rival.display_name}
              </h4>
              <p className="text-xs text-muted-foreground">
                #{rival.current_rank} · {rival.courses_this_season} courses
              </p>
            </div>
            
            {/* Gap indicator */}
            <div className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold',
              isBehind && 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
              isAhead && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
              !isBehind && !isAhead && 'bg-muted text-muted-foreground'
            )}>
              {isBehind ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : isAhead ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {isBehind ? `+${gapAbs}` : isAhead ? `-${gapAbs}` : 'Tied'}
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-head stats */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Head-to-head</span>
          </div>
          <RivalMomentumBadge
            timesOvertaken={rival.times_overtaken}
            timesBeenOvertaken={rival.times_been_overtaken}
            size="sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {rival.times_overtaken}
            </div>
            <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
              You overtook
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {rival.times_been_overtaken}
            </div>
            <div className="text-[10px] text-red-600/70 dark:text-red-400/70">
              They overtook
            </div>
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      {(onViewProfile || onChallenge) && (
        <div className="mt-3 flex gap-2">
          {onViewProfile && (
            <button
              onClick={() => onViewProfile(rival.rival_user_id)}
              className="flex-1 text-xs font-medium py-2 px-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              View Profile
            </button>
          )}
          {onChallenge && isBehind && (
            <button
              onClick={() => onChallenge(rival.rival_user_id)}
              className="flex-1 text-xs font-medium py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Beat {rival.display_name.split(' ')[0]}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
