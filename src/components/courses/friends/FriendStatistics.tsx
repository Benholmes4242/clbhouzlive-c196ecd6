
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';

interface FriendStatisticsProps {
  friendName: string;
  friendUsername?: string;
  totalTop100Played: number;
  averageRating: string | null;
  onAverageRatingClick: () => void;
}

const FriendStatistics: React.FC<FriendStatisticsProps> = ({
  friendName,
  friendUsername,
  totalTop100Played,
  averageRating,
  onAverageRatingClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top 100 Rated</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTop100Played}</div>
          <p className="text-xs text-muted-foreground">
            by {friendName}
          </p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onAverageRatingClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageRating ? averageRating : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Click to view {friendName}'s ratings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendStatistics;
