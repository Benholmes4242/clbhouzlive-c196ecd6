import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Check, ChevronRight, Target } from 'lucide-react';

interface Division {
  id: string;
  name: string;
  threshold: number;
  color: string;
  status: 'locked' | 'current' | 'next' | 'completed';
}

interface DivisionLadderPanelProps {
  divisions: Division[];
  userCourses: number;
  coursesToNext: number;
  nextDivisionName: string;
  estimatedRounds?: number;
}

/**
 * DivisionLadderPanel - Clean division ladder without decorative cruft
 * 
 * Features:
 * - No decorative right-side lines
 * - Clear status icons
 * - Only show "X to go" when meaningful (next division, close)
 * - Progress header with optional estimated rounds
 */
export const DivisionLadderPanel: React.FC<DivisionLadderPanelProps> = ({
  divisions,
  userCourses,
  coursesToNext,
  nextDivisionName,
  estimatedRounds,
}) => {
  // Calculate progress within current tier (mod 10 as simple example)
  const progressPercent = coursesToNext > 0 
    ? Math.min(100, ((10 - (coursesToNext % 10)) / 10) * 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      {coursesToNext > 0 && (
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Next: {nextDivisionName}
            </span>
            <span className="text-sm font-semibold">{coursesToNext} to go</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {estimatedRounds !== undefined && estimatedRounds > 0 && (
            <p className="text-xs text-muted-foreground">
              ~{estimatedRounds} rounds to promotion
            </p>
          )}
        </div>
      )}

      {/* Division List */}
      <div className="space-y-1">
        {divisions.map((division) => (
          <div
            key={division.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
              division.status === 'current' && "bg-primary/10",
              division.status === 'next' && "bg-amber-50",
              division.status === 'locked' && "opacity-60"
            )}
          >
            {/* Status Icon */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              division.status === 'current' && "bg-primary text-white",
              division.status === 'completed' && "bg-muted text-muted-foreground",
              division.status === 'next' && "bg-amber-100 text-amber-600",
              division.status === 'locked' && "bg-muted text-muted-foreground"
            )}>
              {division.status === 'current' && <Check className="w-4 h-4" />}
              {division.status === 'completed' && <Check className="w-4 h-4" />}
              {division.status === 'next' && <ChevronRight className="w-4 h-4" />}
              {division.status === 'locked' && <Lock className="w-4 h-4" />}
            </div>

            {/* Division Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: division.color }}
                />
                <span className={cn(
                  "font-medium text-sm",
                  division.status === 'current' && "text-primary"
                )}>
                  {division.name}
                </span>
                {division.status === 'current' && (
                  <span className="text-[10px] font-medium bg-primary text-white px-2 py-0.5 rounded-full">
                    CURRENT
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {division.threshold}+ courses
              </span>
            </div>

            {/* Right side - only show meaningful content */}
            {division.status === 'next' && coursesToNext <= 5 && (
              <span className="text-xs font-medium text-amber-600">
                {coursesToNext} to go
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DivisionLadderPanel;
