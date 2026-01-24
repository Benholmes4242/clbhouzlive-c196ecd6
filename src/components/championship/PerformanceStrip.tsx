import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, Flame } from 'lucide-react';

interface PerformanceStripProps {
  divisionName: string;
  divisionColor: string;
  rankText: string;
  divisionSizeText: string;
  coursesCount: number;
  streakDays: number;
  nextDivisionName: string;
  coursesToNext: number;
  progressPercent: number;
  isInPromotionZone: boolean;
}

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * PerformanceStrip - Clean stats directly on page background
 * 
 * Features:
 * - No outer card/border - sits on page background
 * - Division header row
 * - Subtle stat pills with bg-muted/20
 * - Bold stat numbers
 */
export const PerformanceStrip: React.FC<PerformanceStripProps> = ({
  divisionName,
  divisionColor,
  rankText,
  divisionSizeText,
  coursesCount,
  streakDays,
  nextDivisionName,
  coursesToNext,
  progressPercent,
  isInPromotionZone,
}) => {
  return (
    <div className="py-4">
      {/* Division Header Row */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: divisionColor }}
          />
          <span className="font-semibold text-base">{divisionName}</span>
        </div>
        {isInPromotionZone && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            Promotion Zone
          </div>
        )}
      </div>

      {/* Stats Row - subtle pills on page background */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center py-4 bg-muted/20 rounded-xl">
          <div className="text-3xl font-black">{rankText}</div>
          <div className="text-xs text-muted-foreground mt-1">in division</div>
        </div>
        <div className="text-center py-4 bg-muted/20 rounded-xl">
          <div className="text-3xl font-black">{coursesCount}</div>
          <div className="text-xs text-muted-foreground mt-1">courses</div>
        </div>
        <div className="text-center py-4 bg-muted/20 rounded-xl">
          <div className="text-3xl font-black flex items-center justify-center gap-1">
            {streakDays}
            {streakDays > 0 && (
              <Flame className={cn(
                "w-5 h-5",
                streakDays >= 7 ? "text-orange-500" : "text-orange-400"
              )} />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">day streak</div>
        </div>
      </div>

      {/* Progress to Next Division */}
      {coursesToNext > 0 && (
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Next: {nextDivisionName}
            </span>
            <span className="font-semibold">{coursesToNext} to go</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, progressPercent)}%`,
                backgroundColor: divisionColor,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceStrip;
