import React from 'react';
import { cn } from '@/lib/utils';
import { Flame, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface PositionCardProps {
  rank: number;
  totalInDivision: number;
  courses: number;
  streak: number;
  division: string;
  divisionColor: string;
  coursesToNextDivision: number;
  nextDivision: string;
  isInPromotionZone: boolean;
  threatAbove?: { name: string; coursesDiff: number };
  threatBelow?: { name: string; coursesDiff: number };
}

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const PositionCard: React.FC<PositionCardProps> = ({
  rank,
  totalInDivision,
  courses,
  streak,
  division,
  divisionColor,
  coursesToNextDivision,
  nextDivision,
  isInPromotionZone,
  threatAbove,
  threatBelow,
}) => {
  return (
    <div 
      className={cn(
        "relative rounded-sq-lg border-2 p-5 transition-all duration-500",
        isInPromotionZone && "ring-2 ring-offset-2 animate-pulse-subtle"
      )}
      style={{
        borderColor: isInPromotionZone ? '#10B981' : divisionColor,
        ...(isInPromotionZone && { 
          ringColor: '#10B981',
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)',
        }),
      }}
    >
      {/* Division Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: divisionColor }}
          />
          <span className="font-semibold text-sm">{division}</span>
        </div>
        {isInPromotionZone && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            Promotion Zone
          </div>
        )}
      </div>

      {/* Main Stats Row */}
      <div className="flex items-center justify-between mb-6">
        {/* Rank */}
        <div className="text-center">
          <div className="text-4xl font-black tracking-tight">
            {getOrdinalSuffix(rank)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            of {totalInDivision} in division
          </div>
        </div>

        {/* Courses */}
        <div className="text-center">
          <div className="text-4xl font-black tracking-tight">{courses}</div>
          <div className="text-xs text-muted-foreground mt-1">courses</div>
        </div>

        {/* Streak */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl font-black tracking-tight">{streak}</span>
            {streak > 0 && (
              <Flame 
                className={cn(
                  "transition-all",
                  streak >= 7 && "w-8 h-8 text-orange-500 animate-flame-large",
                  streak >= 3 && streak < 7 && "w-6 h-6 text-orange-400 animate-flame-medium",
                  streak > 0 && streak < 3 && "w-5 h-5 text-orange-300 animate-flame-small",
                )}
              />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">day streak</div>
        </div>
      </div>

      {/* Threat Indicators */}
      <div className="space-y-2 mb-4">
        {threatAbove && (
          <div className="flex items-center justify-between text-xs bg-muted/50 rounded-sq-sm px-3 py-2">
            <span className="text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1 text-amber-500" />
              {threatAbove.name} is ahead
            </span>
            <span className="font-semibold text-amber-600">
              +{threatAbove.coursesDiff} courses
            </span>
          </div>
        )}
        {threatBelow && (
          <div className="flex items-center justify-between text-xs bg-muted/50 rounded-sq-sm px-3 py-2">
            <span className="text-muted-foreground">
              <TrendingDown className="w-3 h-3 inline mr-1 text-blue-500" />
              {threatBelow.name} is behind
            </span>
            <span className="font-semibold text-blue-600">
              {threatBelow.coursesDiff} courses back
            </span>
          </div>
        )}
      </div>

      {/* Next Division Progress */}
      {coursesToNextDivision > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Next: {nextDivision}
            </span>
            <span className="font-semibold">{coursesToNextDivision} courses to go</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(5, 100 - (coursesToNextDivision * 10))}%`,
                backgroundColor: divisionColor,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
