import React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Trophy } from 'lucide-react';
import { getSeasonGradient } from '@/lib/colorUtils';

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

  const gradient = getSeasonGradient(seasonColor);

  const calculateProgress = (): number => {
    if (!nextDivision) return 100;
    const range = nextDivision.threshold - currentDivision.threshold;
    const progress = userCourses - currentDivision.threshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const progressPercent = calculateProgress();

  return (
    <div className="px-5 py-4">
      {/* Current Club Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Season-colored check circle */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: seasonColor, width: 28, height: 28 }}
          >
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <span className="text-[18px] font-bold text-foreground">
            {currentDivision.name}
          </span>
          {/* CURRENT pill badge with pulsing dot */}
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5"
            style={{
              backgroundColor: gradient.tint,
              borderRadius: '6px',
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ backgroundColor: seasonColor }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ backgroundColor: seasonColor }}
              />
            </span>
            <span
              className="font-semibold uppercase tracking-wide"
              style={{ color: seasonColor, fontSize: '13px', padding: '5px 12px' }}
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
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(to right, ${gradient.dark}, ${gradient.light})`,
              }}
            />
          </div>
          {/* "X to Next" label */}
          <div className="flex justify-end mt-1.5">
            <span className="text-[15px] text-muted-foreground">
              <span className="text-[18px] font-bold" style={{ color: seasonColor }}>
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
        <span className="text-[15px] font-semibold" style={{ color: seasonColor }}>
          {isExpanded ? 'Hide Division Ladder' : 'View Division Ladder'}
        </span>
        <ChevronDown
          className="w-[18px] h-[18px] transition-transform duration-200"
          style={{
            color: seasonColor,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
    </div>
  );
};

export default DivisionProgressPreview;
