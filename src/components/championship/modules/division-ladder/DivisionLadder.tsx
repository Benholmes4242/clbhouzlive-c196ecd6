import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { DivisionStep } from './DivisionStep';
import { DivisionProgress } from './DivisionProgress';
import type { DivisionConfig, DivisionSlug } from '@/types/championship';

interface DivisionLadderProps {
  divisions: DivisionConfig[];
  currentDivision: DivisionSlug;
  coursesPlayed: number;
  className?: string;
  compact?: boolean;
}

/**
 * DivisionLadder - Vertical stepped ladder showing all divisions.
 * Highlights current division and shows progress to next.
 */
export function DivisionLadder({ 
  divisions, 
  currentDivision, 
  coursesPlayed,
  className,
  compact = false
}: DivisionLadderProps) {
  // Sort divisions by tier_order (ascending = rookie first)
  const sortedDivisions = [...divisions].sort((a, b) => a.tier_order - b.tier_order);
  
  // Find current division index
  const currentIndex = sortedDivisions.findIndex(d => d.slug === currentDivision);
  
  // Get next division
  const nextDivision = currentIndex < sortedDivisions.length - 1 
    ? sortedDivisions[currentIndex + 1] 
    : null;

  // In compact mode, only show current, previous, and next
  const visibleDivisions = compact 
    ? sortedDivisions.filter((_, i) => 
        i >= Math.max(0, currentIndex - 1) && i <= Math.min(sortedDivisions.length - 1, currentIndex + 2)
      )
    : sortedDivisions;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 px-1">
        <Trophy className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm text-foreground">Division Ladder</h3>
      </div>

      {/* Progress summary */}
      {nextDivision && (
        <DivisionProgress
          currentDivision={sortedDivisions[currentIndex]}
          nextDivision={nextDivision}
          coursesPlayed={coursesPlayed}
        />
      )}

      {/* Division steps - reversed so highest is at top */}
      <div className="space-y-2">
        {[...visibleDivisions].reverse().map((division, idx) => {
          const actualIndex = sortedDivisions.findIndex(d => d.id === division.id);
          const isActive = division.slug === currentDivision;
          const isUnlocked = actualIndex <= currentIndex;
          const isNext = actualIndex === currentIndex + 1;
          
          return (
            <DivisionStep
              key={division.id}
              division={division}
              currentDivision={currentDivision}
              coursesPlayed={coursesPlayed}
              isActive={isActive}
              isUnlocked={isUnlocked}
              isNext={isNext}
              index={idx}
            />
          );
        })}
      </div>

      {/* Show "more divisions" hint in compact mode */}
      {compact && currentIndex > 1 && (
        <p className="text-xs text-center text-muted-foreground">
          +{currentIndex - 1} more division{currentIndex > 2 ? 's' : ''} below
        </p>
      )}
    </div>
  );
}
