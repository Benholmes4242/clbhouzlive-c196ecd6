
import React from 'react';
import { Users } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';

interface CourseRatingStatsProps {
  courseId: string;
}

const CourseRatingStats = ({ courseId }: CourseRatingStatsProps) => {
  const { data: aggregates, isLoading } = useCourseRatingAggregates(courseId);

  const formatScore = (value: number | null | undefined) =>
    value == null ? '--' : value.toFixed(1);

  if (isLoading) {
    return (
      <div className="border rounded-sq-sm p-4">
        <h3 className="font-semibold mb-3">Community Rating</h3>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-sq-sm p-4">
      <h3 className="font-semibold mb-3">Community Rating</h3>
      
      {aggregates && aggregates.review_count > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClubhouseLogo size="md" showTooltip />
              <span className="text-2xl font-bold">{formatScore(aggregates.avg_overall_score)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{aggregates.review_count} {aggregates.review_count === 1 ? 'rating' : 'ratings'}</span>
            </div>
          </div>

          {/* Breakdown sections */}
          <div className="mt-3 space-y-2.5">
            {[
              { label: 'Design', value: aggregates.avg_design_score },
              { label: 'Condition', value: aggregates.avg_condition_score },
              { label: 'Clubhouse', value: aggregates.avg_clubhouse_score },
              { label: 'Facilities', value: aggregates.avg_facilities_score },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center gap-3">
                <span className="w-[90px] min-w-[90px] text-sm text-muted-foreground">{cat.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (cat.value ?? 0) >= 9.0
                        ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]'
                        : 'bg-[#d1d5db]'
                    }`}
                    style={{ width: `${((cat.value ?? 0) / 10) * 100}%` }}
                  />
                </div>
                <span className="w-[32px] min-w-[32px] text-right text-sm font-semibold">{formatScore(cat.value)}</span>
              </div>
            ))}</div>
        </div>
      ) : (
        <div className="text-muted-foreground">
          No ratings yet. Be the first to rate this course!
        </div>
      )}
    </div>
  );
};

export default CourseRatingStats;
