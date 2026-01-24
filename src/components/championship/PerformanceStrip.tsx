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
 * PerformanceStrip - Clean stats strip without heavy borders
 * 
 * Features:
 * - Light background block instead of card
 * - Subtle internal divider
 * - Consistent spacing
 * - No thick borders
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
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      {/* Row 1: Division + Promotion Zone */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: divisionColor }}
          />
          <span className="font-semibold text-sm">{divisionName}</span>
        </div>
        {isInPromotionZone && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            Promotion Zone
          </div>
        )}
      </div>

      {/* Row 2: Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-black">{rankText}</div>
          <div className="text-xs text-muted-foreground">{divisionSizeText}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black">{coursesCount}</div>
          <div className="text-xs text-muted-foreground">courses</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-black">{streakDays}</span>
            {streakDays > 0 && (
              <Flame className={cn(
                "w-5 h-5",
                streakDays >= 7 ? "text-orange-500" : "text-orange-400"
              )} />
            )}
          </div>
          <div className="text-xs text-muted-foreground">day streak</div>
        </div>
      </div>

      {/* Row 3: Progress to Next Division */}
      {coursesToNext > 0 && (
        <div className="pt-2 border-t border-muted/50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Next: {nextDivisionName}
            </span>
            <span className="font-semibold">{coursesToNext} to go</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceStrip;
