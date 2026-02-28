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
    <section className="px-4 pt-6 pb-5 bg-slate-100 md:pt-8">
      {/* Header with Legend */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Rating vs Community</h3>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-6 rounded-full bg-foreground" />
            <span className="font-bold">You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-6 rounded-full bg-muted-foreground/40" />
            <span className="font-bold">Community</span>
          </div>
        </div>
      </div>

      {/* Metrics with dual bars */}
      <div className="space-y-3">
        {visibleRows.map((row) => (
          <div key={row.label} className="space-y-1">
            {/* Label and values */}
            <div className="flex items-baseline justify-between text-base">
              <span className="font-medium">{row.label}</span>
              <span className="text-sm text-slate-500">
                You: {formatScore(row.you)} · Community: {formatScore(row.community)}
              </span>
            </div>

            {/* Dual bars - brand color for Outstanding (9+), grey gradient otherwise */}
            <div className="relative h-2.5 w-full rounded-full bg-[#E7E5E4] overflow-hidden">
              {/* Community bar (background) */}
              {row.community !== null && (
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    row.community >= 9 
                      ? 'bg-[#f59e0b]/30' 
                      : 'bg-[#A8A29E]/30'
                  }`}
                  style={{ width: `${getPercentage(row.community)}%` }}
                />
              )}

              {/* Your bar (foreground) */}
              {row.you !== null && (
                <div
                  className={`relative h-full rounded-full transition-[width] duration-500 ease-out ${
                    row.you >= 9 
                      ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]' 
                      : 'bg-[#A8A29E]'
                  }`}
                  style={{ width: `${getPercentage(row.you)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RatingComparisonCard;
