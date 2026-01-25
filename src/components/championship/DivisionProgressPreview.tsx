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
    <button
      onClick={onToggle}
      className={cn(
        'w-full py-3 px-4 transition-all',
        'flex flex-col gap-3',
        'hover:bg-slate-50/50 rounded-xl'
      )}
    >
      {/* Top row: Current → Progress → Next */}
      <div className="flex items-center justify-between gap-3">
        {/* Current Division (left) */}
        <div className="min-w-0">
          <p 
            className="text-sm font-semibold truncate"
            style={{ color: currentDivision.color }}
          >
            {currentDivision.name}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">
            Current
          </p>
        </div>

        {/* Progress section (center) */}
        {nextDivision && (
          <div className="flex flex-col items-center gap-1 flex-1 max-w-[140px]">
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: currentDivision.color 
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500">
              {coursesToNext} to go
            </span>
          </div>
        )}

        {/* Next Division (right) */}
        {nextDivision && (
          <div className="min-w-0 text-center">
            <p 
              className="text-sm font-semibold truncate"
              style={{ color: nextDivision.color }}
            >
              {nextDivision.name}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              Next Up
            </p>
          </div>
        )}

        {/* If at max division */}
        {!nextDivision && (
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600">
              Max Division!
            </span>
          </div>
        )}
      </div>

      {/* Bottom row: Expand/Collapse indicator */}
      <div className="flex items-center justify-center gap-2 pt-2">
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Hide Division Ladder</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">
              View all {totalDivisions} divisions
            </span>
          </>
        )}
      </div>
    </button>
  );
};

export default DivisionProgressPreview;
