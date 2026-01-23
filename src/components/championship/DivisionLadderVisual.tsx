import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Check, ChevronRight, Sparkles } from 'lucide-react';

interface Division {
  id: string;
  name: string;
  coursesRequired: number;
  color: string;
  isUnlocked: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

interface DivisionLadderVisualProps {
  divisions: Division[];
  userCourses: number;
  coursesToNext: number;
}

export const DivisionLadderVisual: React.FC<DivisionLadderVisualProps> = ({
  divisions,
  userCourses,
  coursesToNext,
}) => {
  // Reverse so highest division is at top
  const sortedDivisions = [...divisions].reverse();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        Division Ladder
      </h3>

      {/* Progress to next */}
      {coursesToNext > 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-sq-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Next division in
            </span>
            <span className="text-lg font-bold text-primary">
              {coursesToNext} courses
            </span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, ((userCourses % 10) / 10) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Ladder */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-amber-300 via-primary to-muted" />

        {sortedDivisions.map((division) => (
          <div
            key={division.id}
            className={cn(
              "relative flex items-center gap-4 p-3 rounded-sq-md transition-all",
              division.isCurrent && "bg-primary/10 shadow-sm",
              division.isNext && "bg-amber-50",
              !division.isUnlocked && !division.isNext && "opacity-50"
            )}
          >
            {/* Node */}
            <div className={cn(
              "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
              division.isCurrent && "bg-primary border-primary text-white scale-110",
              division.isUnlocked && !division.isCurrent && "bg-white border-primary/50 text-primary",
              division.isNext && "bg-amber-100 border-amber-400 text-amber-600 animate-pulse",
              !division.isUnlocked && !division.isNext && "bg-muted border-muted-foreground/30 text-muted-foreground"
            )}>
              {division.isCurrent && <Check className="w-5 h-5" />}
              {division.isUnlocked && !division.isCurrent && <Check className="w-4 h-4" />}
              {division.isNext && <ChevronRight className="w-5 h-5" />}
              {!division.isUnlocked && !division.isNext && <Lock className="w-4 h-4" />}
            </div>

            {/* Division info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className={cn(
                    "font-semibold",
                    division.isCurrent && "text-primary"
                  )}
                >
                  {division.name}
                </span>
                {division.isCurrent && (
                  <span className="text-[10px] font-medium bg-primary text-white px-2 py-0.5 rounded-full">
                    CURRENT
                  </span>
                )}
                {division.isNext && (
                  <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    NEXT
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {division.coursesRequired}+ courses
              </span>
            </div>

            {/* Color indicator */}
            <div 
              className="w-3 h-8 rounded-full"
              style={{ backgroundColor: division.color }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
