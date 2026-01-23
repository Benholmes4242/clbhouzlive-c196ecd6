import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Target, Zap } from 'lucide-react';
import type { DivisionConfig } from '@/types/championship';

interface DivisionProgressProps {
  currentDivision: DivisionConfig;
  nextDivision: DivisionConfig;
  coursesPlayed: number;
  className?: string;
}

/**
 * DivisionProgress - Shows progress bar and text for next division.
 */
export function DivisionProgress({ 
  currentDivision, 
  nextDivision, 
  coursesPlayed,
  className 
}: DivisionProgressProps) {
  const coursesNeeded = nextDivision.min_courses - currentDivision.min_courses;
  const coursesProgress = coursesPlayed - currentDivision.min_courses;
  const progressPercent = Math.min(100, (coursesProgress / coursesNeeded) * 100);
  const coursesToGo = nextDivision.min_courses - coursesPlayed;
  
  // Estimate based on average activity
  const estimatedRounds = Math.ceil(coursesToGo / 0.5); // Assume ~2 courses per round avg

  return (
    <div className={cn('p-3 rounded-xl bg-muted/30', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Next: {nextDivision.name}
          </span>
        </div>
        <span className="text-xs font-semibold text-foreground">
          {coursesToGo} course{coursesToGo !== 1 ? 's' : ''} to go
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: nextDivision.color_hex }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Progress labels */}
      <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
        <span>{coursesProgress}/{coursesNeeded}</span>
        <span>{Math.round(progressPercent)}%</span>
      </div>

      {/* Estimated rounds callout */}
      {coursesToGo <= 5 && coursesToGo > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-muted-foreground">
              ~{estimatedRounds} round{estimatedRounds !== 1 ? 's' : ''} to promotion
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
