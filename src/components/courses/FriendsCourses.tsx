
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Trophy, Star, Calendar } from 'lucide-react';
import CourseCard from './CourseCard';
import { useNavigate } from 'react-router-dom';

const FriendsCourses = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');

  // Fetch user's accepted friends
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ['user-friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_friends')
        .select(`
          friend_id,
          user_profiles!user_friends_friend_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch selected friend's played courses
  const { data: friendPlayedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['friend-played-courses', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', selectedFriendId)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFriendId,
  });

  // Fetch selected friend's Top 100 courses
  const { data: friendTop100Courses = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['friend-top100-courses', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', selectedFriendId)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFriendId,
  });

  // Fetch selected friend's average rating
  const { data: friendAverageRating } = useQuery({
    queryKey: ['friend-average-rating', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return null;
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', selectedFriendId);

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const total = data.reduce((sum, rating) => sum + rating.rating, 0);
      return (total / data.length).toFixed(1);
    },
    enabled: !!selectedFriendId,
  });

  const selectedFriend = friends.find(f => f.friend_id === selectedFriendId);
  const friendName = selectedFriend?.user_profiles?.display_name || selectedFriend?.user_profiles?.username || 'Friend';

  // Calculate statistics
  const totalTop100Played = friendTop100Courses.length;

  // Filter recent courses to only include those played within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCourses = [...friendPlayedCourses, ...friendTop100Courses]
    .filter((userCourse) => {
      if (!userCourse.played_date) return false;
      const playedDate = new Date(userCourse.played_date);
      return playedDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.played_date || 0).getTime() - new Date(a.played_date || 0).getTime())
    .slice(0, 6);

  const handleAverageRatingClick = () => {
    if (selectedFriendId) {
      navigate(`/profile/${selectedFriend?.user_profiles?.username || selectedFriendId}`);
    }
  };

  if (isLoadingFriends) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Loading your friends...</div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
          <p className="text-muted-foreground">
            Add some friends to see their course progress and golfing journey
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Friend Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select a Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a friend to view their courses" />
            </SelectTrigger>
            <SelectContent>
              {friends.map((friend) => (
                <SelectItem key={friend.friend_id} value={friend.friend_id}>
                  <div className="flex items-center gap-2">
                    {friend.user_profiles?.profile_photo_url && (
                      <img 
                        src={friend.user_profiles.profile_photo_url} 
                        alt={friend.user_profiles.display_name || friend.user_profiles.username || 'Friend'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span>
                      {friend.user_profiles?.display_name || friend.user_profiles?.username || 'Friend'}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedFriendId && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top 100 Played</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTop100Played}</div>
                <p className="text-xs text-muted-foreground">
                  by {friendName}
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleAverageRatingClick}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {friendAverageRating ? `${friendAverageRating}/10` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click to view {friendName}'s profile
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Course Lists */}
          <div className="space-y-8">
            {/* Top 100 Courses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {friendName}'s Top 100 Courses
              </h3>
              {isLoadingTop100 ? (
                <div className="text-center py-8">Loading Top 100 courses...</div>
              ) : friendTop100Courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friendTop100Courses.map((userCourse) => (
                    <CourseCard 
                      key={userCourse.id} 
                      course={userCourse.golf_courses}
                      viewingUserId={selectedFriendId}
                      showPlayedButton={false}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                    <h3 className="text-lg font-semibold mb-2">No Top 100 courses played yet</h3>
                    <p className="text-muted-foreground">
                      {friendName} hasn't played any Top 100 courses yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Courses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {friendName}'s Recent Activity (Last 30 Days)
              </h3>
              {recentCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentCourses.map((userCourse) => (
                    <CourseCard 
                      key={`${userCourse.id}-recent`} 
                      course={userCourse.golf_courses}
                      viewingUserId={selectedFriendId}
                      showPlayedButton={false}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                    <p className="text-muted-foreground">
                      {friendName} hasn't played any courses in the last 30 days
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsCourses;
