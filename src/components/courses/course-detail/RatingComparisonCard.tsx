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

  const getPercentage = (score: number | null) => {
    if (score === null) return 0;
    return (score / 10) * 100;
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/90 shadow-sm px-4 py-4">
      {/* Header with Legend */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">
          YOUR RATING VS COMMUNITY
        </p>
        <div className="flex items-center gap-3 text-meta text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-6 rounded-full bg-foreground/80" />
            <span>You</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-6 rounded-full bg-muted-foreground/30" />
            <span>Community</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {visibleRows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            {/* Label row */}
            <div className="text-body-sm font-medium text-foreground">
              {row.label}
            </div>

            {/* Bars row */}
            <div className="flex gap-2">
              <div
                className="h-2.5 flex-1 rounded-full bg-foreground/80 transition-[width] duration-300 ease-out"
                style={{ width: `${getPercentage(row.you)}%` }}
              />
              <div
                className="h-2.5 flex-1 rounded-full bg-muted-foreground/30 transition-[width] duration-300 ease-out"
                style={{ width: `${getPercentage(row.community)}%` }}
              />
            </div>

            {/* Values row */}
            <div className="mt-0.5 flex justify-between text-meta text-muted-foreground">
              <span>You: {formatScore(row.you)}/10</span>
              <span>Community: {formatScore(row.community)}/10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingComparisonCard;
