
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
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Community Rating</h3>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Community Rating</h3>
      
      {aggregates && aggregates.review_count > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClubhouseLogo size="md" showTooltip />
              <span className="text-2xl font-bold">{formatScore(aggregates.avg_overall_score)}/10</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{aggregates.review_count} {aggregates.review_count === 1 ? 'rating' : 'ratings'}</span>
            </div>
          </div>

          {/* Breakdown sections */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Design</span>
              <span className="font-medium">{formatScore(aggregates.avg_design_score)} / 10</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Condition</span>
              <span className="font-medium">{formatScore(aggregates.avg_condition_score)} / 10</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Facilities</span>
              <span className="font-medium">{formatScore(aggregates.avg_facilities_score)} / 10</span>
            </div>
          </div>
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
