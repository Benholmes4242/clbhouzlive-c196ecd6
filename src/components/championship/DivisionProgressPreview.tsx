import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';

interface Division {
  id: string;
  name: string;
  color: string;
  threshold: number;
  status: 'completed' | 'current' | 'next' | 'locked';
}

interface Props {
  currentDivision: Division | null;
  nextDivision: Division | null;
  coursesToNext: number;
  userCourses: number;
  isExpanded: boolean;
  onToggle: () => void;
  totalDivisions: number;
  completedCount: number;
}

/**
 * DivisionProgressPreview - Collapsible division progress section
 */
export const DivisionProgressPreview: React.FC<Props> = ({
  currentDivision,
  nextDivision,
  coursesToNext,
  userCourses,
  isExpanded,
  onToggle,
  totalDivisions,
  completedCount,
}) => {
  if (!currentDivision) return null;

  // Calculate progress percentage based on actual course count
  const calculateProgress = (): number => {
    if (!nextDivision) return 100;
    const range = nextDivision.threshold - currentDivision.threshold;
    const progress = userCourses - currentDivision.threshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const progressPercent = calculateProgress();

  return (
    <div className="bg-muted/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 transition-colors hover:bg-muted/50 active:scale-[0.98]"
      >
        {/* Top row: Current → Progress → Next */}
        <div className="flex items-center justify-between mb-3">
          {/* Current Division */}
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: currentDivision.color }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: currentDivision.color }}
            >
              {currentDivision.name}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
              Current
            </span>
          </div>
          
          {/* Next Division */}
          {nextDivision && (
            <div className="flex items-center gap-2">
              <span 
                className="text-sm font-medium"
                style={{ color: nextDivision.color }}
              >
                {nextDivision.name}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {coursesToNext} to go
              </span>
            </div>
          )}

          {/* Max division indicator */}
          {!nextDivision && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">
                Max Division!
              </span>
            </div>
          )}
        </div>

        {/* Progress bar with gradient using database colors */}
        {nextDivision && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(to right, ${currentDivision.color}, ${nextDivision.color})`
              }}
            />
          </div>
        )}

        {/* Bottom row: Expand/Collapse indicator */}
        <div className="flex items-center justify-center gap-2">
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Hide Division Ladder</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                View all {totalDivisions} divisions
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default DivisionProgressPreview;