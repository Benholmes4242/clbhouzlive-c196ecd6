
import React from 'react';
import { Users } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';

interface CourseRatingStatsProps {
  courseId: string;
}

const CourseRatingStats = ({ courseId }: CourseRatingStatsProps) => {
  const { data: aggregates, isLoading } = useCourseRatingAggregates(courseId);

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
              <span className="text-2xl font-bold">{aggregates.avg_overall_score}/10</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{aggregates.review_count} ratings</span>
            </div>
          </div>

          {/* Breakdown sections - only show if data exists */}
          {(aggregates.avg_design_score || aggregates.avg_condition_score || aggregates.avg_facilities_score) && (
            <div className="space-y-2 mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Rating Breakdown</h4>
              
              {aggregates.avg_design_score && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Course Design</span>
                    <span className="font-medium">{aggregates.avg_design_score}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(aggregates.avg_design_score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {aggregates.avg_condition_score && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Course Condition</span>
                    <span className="font-medium">{aggregates.avg_condition_score}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(aggregates.avg_condition_score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {aggregates.avg_facilities_score && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Facilities</span>
                    <span className="font-medium">{aggregates.avg_facilities_score}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(aggregates.avg_facilities_score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
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
