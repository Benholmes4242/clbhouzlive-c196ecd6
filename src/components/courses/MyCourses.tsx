
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Star, Trophy, Target } from 'lucide-react';
import CourseCard from './CourseCard';

const MyCourses = () => {
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState('played');

  // Fetch user's played courses
  const { data: playedCourses = [], isLoading: isLoadingPlayed } = useQuery({
    queryKey: ['user-played-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', user.id)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user's Top 100 courses
  const { data: top100Courses = [], isLoading: isLoadingTop100 } = useQuery({
    queryKey: ['user-top100-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', user.id)
        .eq('played', true)
        .order('played_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate statistics
  const totalPlayedCourses = playedCourses.length;
  const totalTop100Played = top100Courses.length;
  const averageRating = playedCourses.length > 0 
    ? playedCourses.reduce((sum, course) => sum + (course.rating || 0), 0) / playedCourses.filter(c => c.rating).length
    : 0;

  const recentCourses = [...playedCourses, ...top100Courses]
    .sort((a, b) => new Date(b.played_date || 0).getTime() - new Date(a.played_date || 0).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Played</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlayedCourses}</div>
            <p className="text-xs text-muted-foreground">
              Total courses tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 100 Played</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTop100Played}</div>
            <p className="text-xs text-muted-foreground">
              World-class courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Lists */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="played">All Played</TabsTrigger>
          <TabsTrigger value="top100">Top 100</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="played" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">All Played Courses ({totalPlayedCourses})</h3>
            {isLoadingPlayed ? (
              <div className="text-center py-8">Loading your courses...</div>
            ) : playedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playedCourses.map((userCourse) => (
                  <CourseCard 
                    key={userCourse.id} 
                    course={userCourse.golf_courses}
                    viewingUserId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No courses played yet</h3>
                  <p className="text-muted-foreground">
                    Start exploring courses and mark them as played to track your golf journey
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="top100" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Top 100 Courses Played ({totalTop100Played})</h3>
            {isLoadingTop100 ? (
              <div className="text-center py-8">Loading your Top 100 courses...</div>
            ) : top100Courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {top100Courses.map((userCourse) => (
                  <CourseCard 
                    key={userCourse.id} 
                    course={userCourse.golf_courses}
                    viewingUserId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                  <h3 className="text-lg font-semibold mb-2">No Top 100 courses played yet</h3>
                  <p className="text-muted-foreground">
                    Explore the world's greatest golf courses and add them to your played list
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recently Played</h3>
            {recentCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentCourses.map((userCourse) => (
                  <CourseCard 
                    key={`${userCourse.id}-recent`} 
                    course={userCourse.golf_courses}
                    viewingUserId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                  <p className="text-muted-foreground">
                    Play some courses and they'll appear here
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

export default MyCourses;
