import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, Users, Camera, Star } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CourseLeaderboardTabProps {
  courseId: string;
}

interface LeaderboardUser {
  user_id: string;
  username?: string;
  display_name?: string;
  profile_photo_url?: string;
  last_played?: string;
  review_count: number;
  avg_rating: number;
  media_count: number;
  total_score: number;
}

const CourseLeaderboardTab = ({ courseId }: CourseLeaderboardTabProps) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['course-leaderboard', courseId, activeFilter],
    queryFn: async () => {
      // Get all users who have interacted with this course
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('user_id, rating, review, review_date')
        .eq('course_id', courseId);

      if (ratingsError) throw ratingsError;
      if (!ratings || ratings.length === 0) return [];

      // Get media count for each user
      const { data: mediaData, error: mediaError } = await supabase
        .from('course_review_media')
        .select(`
          review_id,
          course_ratings!inner (
            user_id,
            course_id
          )
        `)
        .eq('course_ratings.course_id', courseId);

      // Get user profiles
      const userIds = [...new Set(ratings.map(r => r.user_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Calculate stats for each user
      const userStats = userIds.map(userId => {
        const userRatings = ratings.filter(r => r.user_id === userId);
        const userReviews = userRatings.filter(r => r.review && r.review.trim() !== '');
        const userMediaCount = mediaData?.filter(m => m.course_ratings.user_id === userId).length || 0;
        
        const avgRating = userRatings.length > 0 
          ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length
          : 0;

        const lastPlayed = userRatings
          .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())[0]?.review_date;

        const profile = profiles?.find(p => p.id === userId);

        // Calculate total score (weighted combination of reviews, media, and rating)
        const totalScore = (userReviews.length * 10) + (userMediaCount * 5) + (avgRating * 2);

        return {
          user_id: userId,
          username: profile?.username,
          display_name: profile?.display_name,
          profile_photo_url: profile?.profile_photo_url,
          last_played: lastPlayed,
          review_count: userReviews.length,
          avg_rating: Math.round(avgRating * 10) / 10,
          media_count: userMediaCount,
          total_score: totalScore
        };
      });

      // Sort by total score
      return userStats.sort((a, b) => b.total_score - a.total_score);
    },
    enabled: !!courseId,
  });

  const getUserDisplayName = (user: LeaderboardUser) => {
    return user.display_name || user.username || 'Anonymous';
  };

  const getUserInitials = (user: LeaderboardUser) => {
    const name = getUserDisplayName(user);
    if (name === 'Anonymous') return 'A';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-medium">#{index + 1}</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-card animate-pulse">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
        <p className="text-muted-foreground">Be the first to review this course and top the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="media">Most Media</TabsTrigger>
          <TabsTrigger value="reviews">Most Reviews</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Leaderboard */}
      <div className="space-y-3">
        {leaderboard.map((user, index) => (
          <div key={user.user_id} className="flex items-center gap-4 p-4 bg-card border hover:shadow-md transition-shadow">
            {/* Rank */}
            <div className="flex items-center justify-center w-8">
              {getRankIcon(index)}
            </div>

            {/* User Avatar */}
            <SquircleAvatar
              src={user.profile_photo_url}
              alt={getUserDisplayName(user)}
              size={48}
              thinRing
              fallback={getUserInitials(user)}
            />

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{getUserDisplayName(user)}</span>
                {user.username && (
                  <span className="text-muted-foreground text-sm">@{user.username}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Last played: {formatDate(user.last_played)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-lg font-semibold">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {user.review_count}
                </div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-1 text-lg font-semibold">
                  <Camera className="h-4 w-4 text-blue-500" />
                  {user.media_count}
                </div>
                <div className="text-xs text-muted-foreground">Media</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {user.avg_rating > 0 ? user.avg_rating : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
            </div>

            {/* Total Score Badge */}
            <Badge variant="secondary" className="ml-4">
              {Math.round(user.total_score)} pts
            </Badge>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-muted/50 rounded-sq-sm p-4">
        <h4 className="font-medium mb-2">Scoring System</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Review with text: 10 points</p>
          <p>• Media upload: 5 points</p>
          <p>• Rating quality: 2 points per rating point</p>
        </div>
      </div>
    </div>
  );
};

export default CourseLeaderboardTab;