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

// Helper function to get the best ranking for sorting
const getCourseRanking = (course: any) => {
  // Prioritize rankings in this order: regional, global
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999; // Default for courses without rankings
};

// Custom sorting function for user courses
const getSortedUserCourses = (userCourses: any[]) => {
  // Get courses with ratings
  const rated = userCourses
    .filter(c => c.rating !== null && c.rating !== undefined)
    .sort((a, b) => b.rating - a.rating); // Highest rating first
  
  // Get courses without ratings, sorted by Top 100 ranking
  const unrated = userCourses
    .filter(c => c.rating === null || c.rating === undefined)
    .sort((a, b) => {
      const aRank = getCourseRanking(a.golf_courses);
      const bRank = getCourseRanking(b.golf_courses);
      return aRank - bRank; // Lower rank number first
    });

  return [...rated, ...unrated];
};

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
  const displayName = isOwnProfile ? 'My' : (targetUserProfile?.display_name || targetUserProfile?.username || 'User\'s');

  // Fetch user's played courses with ratings
  const { data: playedCoursesRaw = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['user-played-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      // First get the courses
      const { data: courses, error: coursesError } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', targetUserId)
        .eq('played', true);

      if (coursesError) throw coursesError;
      
      // Then get ratings for these courses
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', targetUserId);

      if (ratingsError) throw ratingsError;
      
      // Create a map of ratings by course_id
      const ratingsMap = new Map();
      ratings?.forEach(rating => {
        ratingsMap.set(rating.course_id, rating.rating);
      });
      
      // Add ratings to courses
      const coursesWithRatings = courses?.map(course => ({
        ...course,
        rating: ratingsMap.get(course.course_id) || null
      })) || [];
      
      return getSortedUserCourses(coursesWithRatings);
    },
    enabled: !!targetUserId,
  });

  // Fetch user's Top 100 courses with ratings
  const { data: top100CoursesRaw = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['user-top100-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      // First get the courses
      const { data: courses, error: coursesError } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', targetUserId)
        .eq('played', true);

      if (coursesError) throw coursesError;
      
      // Then get ratings for these courses
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', targetUserId);

      if (ratingsError) throw ratingsError;
      
      // Create a map of ratings by course_id
      const ratingsMap = new Map();
      ratings?.forEach(rating => {
        ratingsMap.set(rating.course_id, rating.rating);
      });
      
      // Add ratings to courses
      const coursesWithRatings = courses?.map(course => ({
        ...course,
        rating: ratingsMap.get(course.course_id) || null
      })) || [];
      
      return getSortedUserCourses(coursesWithRatings);
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
  const totalTop100Played = top100CoursesRaw.length;

  // Filter recent courses to only include those played within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCourses = [...playedCoursesRaw, ...top100CoursesRaw]
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
        <h1 className="text-3xl font-bold mb-2">{displayName} Courses</h1>
        <p className="text-muted-foreground">
          {isOwnProfile ? 'Track your golf course journey' : `View ${displayName.replace("'s", '')}'s golf course checklist`}
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
            ) : top100CoursesRaw.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {top100CoursesRaw.map((userCourse) => (
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
                    {isOwnProfile ? 'No Top 100 courses played yet' : `${displayName.replace("'s", '')} hasn't played any Top 100 courses yet`}
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
                    {isOwnProfile ? 'No recent activity' : `${displayName.replace("'s", '')} has no recent activity`}
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
