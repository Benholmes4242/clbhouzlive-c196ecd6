import React from 'react';
import { cn } from '@/lib/utils';

interface RatingCategory {
  label: string;
  value: number | null | undefined;
}

interface RatingBreakdownGridProps {
  categories: RatingCategory[];
  className?: string;
}

const formatScore = (value: number | null | undefined) =>
  value == null ? '--' : value.toFixed(1);

export const RatingBreakdownGrid: React.FC<RatingBreakdownGridProps> = ({
  categories,
  className,
}) => {
  const visible = categories.filter(c => c.value != null);
  if (visible.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-2 gap-x-4 gap-y-3', className)}>
      {visible.map((cat) => {
        const score = cat.value ?? 0;
        const isOutstanding = score >= 9;
        const barColorClass = isOutstanding
          ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]'
          : 'bg-[#A8A29E]';

        return (
          <div key={cat.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{cat.label}</span>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {formatScore(cat.value)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', barColorClass)}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
