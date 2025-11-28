import React from 'react';

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
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-600 flex-shrink-0">
              {cat.label}
            </span>
            <div className="flex items-center gap-2 flex-1 max-w-[160px]">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-600 transition-all"
                  style={{ width: `${((cat.value || 0) / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-900 w-6 text-right flex-shrink-0">
                {formatScore(cat.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
