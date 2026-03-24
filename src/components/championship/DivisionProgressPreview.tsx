import React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Trophy } from 'lucide-react';

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
  seasonColor?: string;
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
  seasonColor = '#006747',
}) => {
  if (!currentDivision) return null;

  const calculateProgress = (): number => {
    if (!nextDivision) return 100;
    const range = nextDivision.threshold - currentDivision.threshold;
    const progress = userCourses - currentDivision.threshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const progressPercent = calculateProgress();
  const isMaxDivision = !nextDivision;

  return (
    <div className="px-5 py-2">
      {/* Compact single row */}
      <div
        className="flex items-center gap-3"
        style={{
          height: 48,
          background: 'hsl(var(--card))',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '0 14px',
        }}
      >
        {/* Check circle */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: seasonColor }}
        >
          {isMaxDivision ? (
            <Trophy className="w-3.5 h-3.5 text-white" />
          ) : (
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          )}
        </div>

        {/* Division name */}
        <span className="text-[14px] font-bold text-foreground flex-shrink-0">
          {currentDivision.name}
        </span>

        {/* Progress bar */}
        {nextDivision && (
          <div className="flex-1 mx-1">
            <div
              className="h-[4px] rounded-full overflow-hidden"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: seasonColor,
                }}
              />
            </div>
          </div>
        )}

        {isMaxDivision && <div className="flex-1" />}

        {/* "N to next" text */}
        <span
          className="text-[12px] font-semibold flex-shrink-0"
          style={{ color: seasonColor }}
        >
          {isMaxDivision ? 'Max Division!' : `${coursesToNext} to ${nextDivision.name}`}
        </span>
      </div>

      {/* Toggle — right-aligned text link */}
      <div className="flex justify-end mt-1.5">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 active:scale-[0.98] transition-transform"
        >
          <span className="text-[13px] font-semibold" style={{ color: seasonColor }}>
            {isExpanded ? 'Hide Ladder' : 'View Ladder'}
          </span>
          <ChevronDown
            className="w-[16px] h-[16px] transition-transform duration-200"
            style={{
              color: seasonColor,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default DivisionProgressPreview;
