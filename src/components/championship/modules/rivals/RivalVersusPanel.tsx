import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { UserRival, UserChampionshipStatus } from '@/types/championship';

interface RivalVersusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rival: UserRival;
  userStatus: UserChampionshipStatus;
  className?: string;
}

/**
 * RivalVersusPanel - Full head-to-head comparison drawer.
 * Shows detailed stats between user and selected rival.
 */
export function RivalVersusPanel({ 
  isOpen, 
  onClose, 
  rival, 
  userStatus,
  className 
}: RivalVersusPanelProps) {
  const userInitials = 'You';
  const rivalInitials = rival.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const isAhead = rival.gap < 0;
  const gapAbs = Math.abs(rival.gap);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-3xl shadow-xl',
              'max-h-[80vh] overflow-y-auto',
              className
            )}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-bold text-lg">Head-to-Head</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Versus header */}
            <div className="px-4 py-6">
              <div className="flex items-center justify-center gap-4">
                {/* User */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">You</span>
                  </div>
                  <div className="font-semibold text-foreground">You</div>
                  <div className="text-sm text-muted-foreground">
                    #{userStatus.current_rank}
                  </div>
                </div>

                {/* VS badge */}
                <div className="px-4 py-2 rounded-full bg-muted">
                  <span className="text-sm font-bold text-muted-foreground">VS</span>
                </div>

                {/* Rival */}
                <div className="text-center">
                  <SquircleAvatar
                    size={64}
                    src={rival.avatar_url}
                    alt={rival.display_name}
                    fallback={rivalInitials}
                    className="mx-auto mb-2"
                  />
                  <div className="font-semibold text-foreground truncate max-w-[100px]">
                    {rival.display_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    #{rival.current_rank}
                  </div>
                </div>
              </div>

              {/* Gap indicator */}
              <div className={cn(
                'mt-4 mx-auto w-fit px-4 py-2 rounded-full flex items-center gap-2',
                isAhead && 'bg-emerald-50 dark:bg-emerald-950/50',
                !isAhead && rival.gap > 0 && 'bg-red-50 dark:bg-red-950/50',
                rival.gap === 0 && 'bg-muted'
              )}>
                {isAhead ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : rival.gap > 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : null}
                <span className={cn(
                  'font-semibold',
                  isAhead && 'text-emerald-600 dark:text-emerald-400',
                  !isAhead && rival.gap > 0 && 'text-red-600 dark:text-red-400',
                  rival.gap === 0 && 'text-muted-foreground'
                )}>
                  {rival.gap === 0 
                    ? 'Tied!'
                    : isAhead 
                      ? `You're ${gapAbs} course${gapAbs !== 1 ? 's' : ''} ahead`
                      : `${gapAbs} course${gapAbs !== 1 ? 's' : ''} behind`
                  }
                </span>
              </div>
            </div>

            {/* Stats comparison */}
            <div className="px-4 pb-6 space-y-3">
              <StatRow
                label="Courses This Season"
                userValue={userStatus.courses_this_season}
                rivalValue={rival.courses_this_season}
              />
              <StatRow
                label="Current Streak"
                userValue={userStatus.streak_current}
                rivalValue={0} // Would need rival streak data
                suffix=" days"
              />
              <StatRow
                label="Times Overtaken Them"
                userValue={rival.times_overtaken}
                rivalValue={rival.times_been_overtaken}
                labels={['You', 'Them']}
              />
            </div>

            {/* Timeline placeholder */}
            <div className="px-4 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Rivalry Timeline</h3>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">
                  Rivalry history coming soon
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatRow({ 
  label, 
  userValue, 
  rivalValue, 
  suffix = '',
  labels = ['You', 'Rival']
}: { 
  label: string; 
  userValue: number; 
  rivalValue: number; 
  suffix?: string;
  labels?: [string, string];
}) {
  const userWins = userValue > rivalValue;
  const rivalWins = rivalValue > userValue;
  
  return (
    <div className="p-3 rounded-xl bg-muted/30">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-2',
          userWins && 'text-emerald-600 dark:text-emerald-400'
        )}>
          <span className="text-lg font-bold">{userValue}{suffix}</span>
          <span className="text-xs text-muted-foreground">{labels[0]}</span>
        </div>
        <div className={cn(
          'flex items-center gap-2',
          rivalWins && 'text-emerald-600 dark:text-emerald-400'
        )}>
          <span className="text-xs text-muted-foreground">{labels[1]}</span>
          <span className="text-lg font-bold">{rivalValue}{suffix}</span>
        </div>
      </div>
    </div>
  );
}
