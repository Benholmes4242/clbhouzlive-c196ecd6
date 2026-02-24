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
 * DivisionProgressPreview — Premium progress bar with gradient fill and milestone markers.
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

  const calculateProgress = (): number => {
    if (!nextDivision) return 100;
    const range = nextDivision.threshold - currentDivision.threshold;
    const progress = userCourses - currentDivision.threshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const progressPercent = calculateProgress();

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
      <button
        onClick={onToggle}
        className="w-full p-4 transition-colors hover:bg-muted/30 active:scale-[0.98]"
      >
        {/* Top row: Current → Next */}
        <div className="flex items-center justify-between mb-3">
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
            {/* CURRENT badge — green pill treatment */}
            <div 
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(82, 183, 136, 0.12)' }}
            >
              {/* Pulsing dot */}
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: '#40916C' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#40916C' }} />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#40916C' }}>
                Current
              </span>
            </div>
          </div>
          
          {nextDivision ? (
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
          ) : (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">
                Max Division!
              </span>
            </div>
          )}
        </div>

        {/* Progress bar — slim with gradient fill */}
        {nextDivision && (
          <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.06)' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercent}%`,
                background: 'linear-gradient(to right, #2D6A4F, #52B788)'
              }}
            />
          </div>
        )}

        {/* Expand/Collapse */}
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
