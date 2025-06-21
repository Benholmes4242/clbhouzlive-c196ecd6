
import React from 'react';
import { Star, Users } from 'lucide-react';

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
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
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
