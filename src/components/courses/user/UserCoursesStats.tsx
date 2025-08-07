
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';

interface UserCoursesStatsProps {
  totalTop100Played: number;
  averageRating: string | null;
  isOwnProfile: boolean;
  onAverageRatingClick?: () => void;
}

const UserCoursesStats: React.FC<UserCoursesStatsProps> = ({
  totalTop100Played,
  averageRating,
  isOwnProfile,
  onAverageRatingClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-black/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-4 min-h-[100px] flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium">Top 100 Played</span>
        </div>
        <div className="text-2xl font-bold">{totalTop100Played}</div>
      </div>

      <div 
        className={`bg-black/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-4 min-h-[100px] flex flex-col justify-center transition-all ${isOwnProfile ? "cursor-pointer hover:bg-black/30 hover:scale-105" : ""}`}
        onClick={isOwnProfile ? onAverageRatingClick : undefined}
      >
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Average Rating</span>
        </div>
        <div className="text-2xl font-bold">
          {averageRating ? `${averageRating}/10` : 'N/A'}
        </div>
        {isOwnProfile && (
          <p className="text-xs text-muted-foreground mt-1">
            Click to view all ratings
          </p>
        )}
      </div>
    </div>
  );
};

export default UserCoursesStats;
