
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard';

interface UserCoursesContentProps {
  username?: string;
}

const UserCoursesContent: React.FC<UserCoursesContentProps> = ({ username }) => {
  const { user: currentUser } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('top100');

  // Determine if we're viewing own profile or another user's
  const isOwnProfile = !username;

  // Get target user profile if viewing another user
  const { data: targetUserProfile } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username) return null;
      
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .maybeSingle();
      
      if (!data && !error) {
        const { data: idData, error: idError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', username)
          .eq('is_public', true)
          .maybeSingle();
        
        data = idData;
        error = idError;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const targetUserId = isOwnProfile ? currentUser?.id : targetUserProfile?.id;
  
  // Get first name from display_name for tab label
  const getFirstName = (profile: any) => {
    if (!profile) return 'User';
    const displayName = profile.display_name || profile.username || 'User';
    return displayName.split(' ')[0]; // Get first word as first name
  };

  const tabLabel = isOwnProfile ? 'My Courses' : `${getFirstName(targetUserProfile)}'s Courses`;
  const displayName = isOwnProfile ? 'My' : (targetUserProfile?.display_name || targetUserProfile?.username || 'User\'s');

  // Fetch user's played courses
  const { data: playedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['user-played-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', targetUserId)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId,
  });

  // Fetch user's Top 100 courses
  const { data: top100Courses = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['user-top100-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', targetUserId)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId,
  });

  // Fetch user's average rating
  const { data: averageRating } = useQuery({
    queryKey: ['user-average-rating', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('user_id', targetUserId);

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const total = data.reduce((sum, rating) => sum + rating.rating, 0);
      return (total / data.length).toFixed(1);
    },
    enabled: !!targetUserId,
  });

  // Calculate statistics
  const totalTop100Played = top100Courses.length;

  // Filter recent courses to only include those played within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCourses = [...playedCourses, ...top100Courses]
    .filter((userCourse) => {
      if (!userCourse.played_date) return false;
      const playedDate = new Date(userCourse.played_date);
      return playedDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.played_date || 0).getTime() - new Date(a.played_date || 0).getTime())
    .slice(0, 6);

  const handleAverageRatingClick = () => {
    if (isOwnProfile) {
      navigate('/my-ratings');
    } else if (targetUserProfile?.username) {
      navigate(`/my-ratings?user=${targetUserProfile.username}`);
    } else if (targetUserId) {
      navigate(`/my-ratings?userId=${targetUserId}`);
    }
  };

  // Redirect to auth if not logged in and trying to view someone else's profile
  if (!currentUser && !isOwnProfile) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">User's Golf Courses</h1>
          <p className="text-muted-foreground">
            Sign in to view user profiles and course checklists
          </p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
            <p className="text-muted-foreground mb-4">
              Create an account to view user profiles and course information
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (!isOwnProfile && !targetUserProfile && username) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Loading...</h1>
          <p className="text-muted-foreground">
            Loading user profile and course information
          </p>
        </div>
      </div>
    );
  }

  // Show not found if user doesn't exist
  if (!isOwnProfile && !targetUserProfile && username) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground">
            The user profile you're looking for doesn't exist or isn't public
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{tabLabel}</h1>
        <p className="text-muted-foreground">
          {isOwnProfile ? 'Track your golf course journey' : `View ${getFirstName(targetUserProfile)}'s golf course checklist`}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 100 Played</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTop100Played}</div>
          </CardContent>
        </Card>

        <Card className={isOwnProfile ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={isOwnProfile ? handleAverageRatingClick : undefined}>
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

      {/* Course Lists */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="top100">Top 100</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="top100" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Top 100 Courses Played</h3>
            {isLoadingTop100 ? (
              <div className="text-center py-8">Loading Top 100 courses...</div>
            ) : top100Courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {top100Courses.map((userCourse) => (
                  <CourseCard 
                    key={userCourse.id} 
                    course={userCourse.golf_courses}
                    viewingUserId={targetUserId}
                    showPlayedButton={false}
                    viewContext="global"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isOwnProfile ? 'No Top 100 courses played yet' : `${getFirstName(targetUserProfile)} hasn't played any Top 100 courses yet`}
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? 'Explore the world\'s greatest golf courses and add them to your played list'
                      : 'Check back later to see their golf course journey'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recently Played (Last 30 Days)</h3>
            {recentCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentCourses.map((userCourse) => (
                  <CourseCard 
                    key={`${userCourse.id}-recent`} 
                    course={userCourse.golf_courses}
                    viewingUserId={targetUserId}
                    showPlayedButton={false}
                    viewContext="global"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isOwnProfile ? 'No recent activity' : `${getFirstName(targetUserProfile)} has no recent activity`}
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? 'Play some courses in the last 30 days and they\'ll appear here'
                      : 'No courses played in the last 30 days'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserCoursesContent;
