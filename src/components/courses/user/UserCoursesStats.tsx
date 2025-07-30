
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
      <Card className="bg-black/20 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top 100 Played</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTop100Played}</div>
        </CardContent>
      </Card>

      <Card 
        className={`bg-black/20 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg ${isOwnProfile ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
        onClick={isOwnProfile ? onAverageRatingClick : undefined}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageRating ? `${averageRating}/10` : 'N/A'}
          </div>
          {isOwnProfile && (
            <p className="text-xs text-muted-foreground">
              Click to view all ratings
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCoursesStats;
