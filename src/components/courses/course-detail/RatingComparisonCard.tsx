import React from 'react';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';

interface RatingComparisonProps {
  userRating: UserCourseRating;
  aggregates: CourseRatingAggregate;
}

const RatingComparisonCard: React.FC<RatingComparisonProps> = ({ userRating, aggregates }) => {
  const rows = [
    {
      label: 'Overall',
      you: userRating.rating,
      community: aggregates.avg_overall_score,
    },
    {
      label: 'Course Design',
      you: userRating.design_score,
      community: aggregates.avg_design_score,
    },
    {
      label: 'Course Condition',
      you: userRating.condition_score,
      community: aggregates.avg_condition_score,
    },
    {
      label: 'Clubhouse',
      you: userRating.clubhouse_score,
      community: aggregates.avg_clubhouse_score,
    },
    {
      label: 'Facilities',
      you: userRating.facilities_score,
      community: aggregates.avg_facilities_score,
    },
  ];

  // Filter out any rows where both values are null
  const visibleRows = rows.filter(
    (row) => row.you !== null || row.community !== null
  );

  if (visibleRows.length === 0) return null;

  const formatScore = (score: number | null) => {
    if (score === null) return '--';
    return score % 1 === 0 ? score.toString() : score.toFixed(1);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your rating vs community
        </div>
      </div>

      <div className="grid gap-3">
        {visibleRows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-3">
                {row.you !== null && (
                  <span className="text-[11px] font-medium text-foreground">
                    You: {formatScore(row.you)}
                  </span>
                )}
                {row.community !== null && (
                  <span className="text-[11px] text-muted-foreground">
                    Community: {formatScore(row.community)}
                  </span>
                )}
              </div>
            </div>

            {/* Dual Bars */}
            <div className="grid grid-cols-2 gap-2">
              {/* You */}
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 flex-1 rounded-full bg-muted/60">
                  {row.you !== null && (
                    <div
                      className="h-1.5 rounded-full bg-slate-800"
                      style={{ width: `${(row.you / 10) * 100}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Community */}
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 flex-1 rounded-full bg-muted/60">
                  {row.community !== null && (
                    <div
                      className="h-1.5 rounded-full bg-muted-foreground/60"
                      style={{ width: `${(row.community / 10) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingComparisonCard;
