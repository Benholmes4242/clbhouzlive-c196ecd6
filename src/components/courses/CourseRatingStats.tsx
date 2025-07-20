
import React from 'react';
import { Users } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface RatingStats {
  average_rating: number;
  total_ratings: number;
}

interface CourseRatingStatsProps {
  ratingStats: RatingStats | null;
}

const CourseRatingStats = ({ ratingStats }: CourseRatingStatsProps) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Community Rating</h3>
      
      {ratingStats ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClubhouseLogo size="md" showTooltip />
            <span className="text-2xl font-bold">{ratingStats.average_rating}/10</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{ratingStats.total_ratings} ratings</span>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">
          No ratings yet.
        </div>
      )}
    </div>
  );
};

export default CourseRatingStats;
