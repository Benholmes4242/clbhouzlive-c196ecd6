import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, ChevronRight, Trophy } from 'lucide-react';

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
  isExpanded: boolean;
  onToggle: () => void;
  totalDivisions: number;
  completedCount: number;
}

export const DivisionProgressPreview: React.FC<Props> = ({
  currentDivision,
  nextDivision,
  coursesToNext,
  isExpanded,
  onToggle,
  totalDivisions,
  completedCount,
}) => {
  if (!currentDivision) return null;

  // Calculate progress percentage for the mini bar
  const progressPercent = nextDivision 
    ? Math.max(20, 100 - (coursesToNext * 10))
    : 100;

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full py-3 px-4 transition-all',
        'flex flex-col gap-3',
        'hover:bg-slate-50/50 rounded-xl'
      )}
    >
      {/* Top row: Current → Next */}
      <div className="flex items-center justify-between gap-3">
        {/* Current Division */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${currentDivision.color}20` }}
          >
            <Check 
              className="w-4 h-4" 
              style={{ color: currentDivision.color }} 
            />
          </div>
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
        </div>

        {/* Progress indicator */}
        {nextDivision && (
          <>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="w-8 h-0.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: currentDivision.color 
                  }}
                />
              </div>
              <span className="text-xs font-bold text-orange-500 whitespace-nowrap">
                {coursesToNext} to go
              </span>
              <div className="w-8 h-0.5 bg-slate-200 rounded-full" />
            </div>

            {/* Next Division */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <p 
                  className="text-sm font-semibold truncate"
                  style={{ color: nextDivision.color }}
                >
                  {nextDivision.name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Next
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${nextDivision.color}15` }}
              >
                <ChevronRight 
                  className="w-4 h-4" 
                  style={{ color: nextDivision.color }} 
                />
              </div>
            </div>
          </>
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
