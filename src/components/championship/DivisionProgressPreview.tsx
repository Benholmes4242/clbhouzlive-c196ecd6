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

  const calculateProgress = (): number => {
    if (!nextDivision) return 100;
    const range = nextDivision.threshold - currentDivision.threshold;
    const progress = userCourses - currentDivision.threshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const progressPercent = calculateProgress();

  return (
    <div className="px-4 py-3">
      {/* Current Club Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Green check circle */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#40916C' }}
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <span className="text-base font-bold text-foreground">
            {currentDivision.name}
          </span>
          {/* CURRENT pill badge with pulsing dot */}
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5"
            style={{
              backgroundColor: 'rgba(82, 183, 136, 0.12)',
              borderRadius: '6px',
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ backgroundColor: '#40916C' }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ backgroundColor: '#40916C' }}
              />
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#40916C' }}
            >
              Current
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {nextDivision && (
        <div className="mb-3">
          <div
            className="h-[5px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(to right, #2D6A4F, #52B788)',
              }}
            />
          </div>
          {/* "X to Fairway" label */}
          <div className="flex justify-end mt-1.5">
            <span className="text-xs text-muted-foreground">
              <span className="font-bold" style={{ color: '#40916C' }}>
                {coursesToNext}
              </span>{' '}
              to {nextDivision.name}
            </span>
          </div>
        </div>
      )}

      {!nextDivision && (
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4" style={{ color: '#D4A853' }} />
          <span className="text-xs font-medium" style={{ color: '#D4A853' }}>
            Max Division!
          </span>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-1.5 pt-1 active:scale-[0.98] transition-transform"
      >
        <span className="text-sm font-medium" style={{ color: '#40916C' }}>
          {isExpanded ? 'Hide Division Ladder' : 'View Division Ladder'}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{
            color: '#40916C',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
    </div>
  );
};

export default DivisionProgressPreview;
