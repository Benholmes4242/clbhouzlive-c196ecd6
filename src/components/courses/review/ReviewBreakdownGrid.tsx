import React from 'react';
import { cn } from '@/lib/utils';

interface BreakdownScores {
  design_score?: number | null;
  condition_score?: number | null;
  clubhouse_score?: number | null;
  facilities_score?: number | null;
}

interface ReviewBreakdownGridProps {
  scores: BreakdownScores;
}

const formatScore = (value: number | null | undefined) =>
  value == null ? null : value.toFixed(1);

export const ReviewBreakdownGrid: React.FC<ReviewBreakdownGridProps> = ({ scores }) => {
  const hasAnyScore = 
    scores.design_score != null ||
    scores.condition_score != null ||
    scores.clubhouse_score != null ||
    scores.facilities_score != null;

  if (!hasAnyScore) return null;

  const categories = [
    { label: 'Design', value: scores.design_score },
    { label: 'Condition', value: scores.condition_score },
    { label: 'Clubhouse', value: scores.clubhouse_score },
    { label: 'Facilities', value: scores.facilities_score },
  ].filter(cat => cat.value != null);

  if (categories.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="space-y-2.5">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-3">
            <span className="w-[90px] min-w-[90px] text-[11px] font-medium tracking-wide text-slate-600">
              {cat.label}
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  (cat.value || 0) >= 9.0
                    ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]'
                    : 'bg-[#d1d5db]'
                )}
                style={{ width: `${((cat.value || 0) / 10) * 100}%` }}
              />
            </div>
            <span className="w-[32px] min-w-[32px] text-right text-[11px] font-semibold text-slate-700">
              {formatScore(cat.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
