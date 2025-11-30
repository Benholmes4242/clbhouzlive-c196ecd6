
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trophy, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MyCoursesStatsProps {
  totalCoursesPlayed: number;
  totalTop100Played: number;
  averageRating: string | null;
}

const MyCoursesStats = ({ totalCoursesPlayed, totalTop100Played, averageRating }: MyCoursesStatsProps) => {
  const navigate = useNavigate();

  const handleAverageRatingClick = () => {
    navigate('/my-ratings');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Courses Played</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCoursesPlayed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top 100 Rated</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTop100Played}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleAverageRatingClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageRating ? averageRating : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Click to view all ratings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyCoursesStats;
