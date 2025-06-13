
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Calendar, Star, MapPin, User, CheckCircle, Target } from 'lucide-react';
import CourseCard from './CourseCard';

interface UserCourse {
  id: string;
  played: boolean;
  rating: number | null;
  notes: string | null;
  played_date: string | null;
  golf_courses: {
    id: string;
    name: string;
    country: string;
    region: string;
    continent: string;
    global_rank: number | null;
    regional_rank: number | null;
    description: string;
    thumbnail_image: string;
    latitude: number | null;
    longitude: number | null;
  };
}

const MyCourses = () => {
  const { data: { user } } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await supabase.auth.getUser();
    },
  });

  const { data: userCourses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      if (!user?.user) return [];

      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (*)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserCourse[];
    },
    enabled: !!user?.user,
  });

  const { data: top100Stats } = useQuery({
    queryKey: ['top100-stats'],
    queryFn: async () => {
      if (!user?.user) return { total: 0, played: 0 };

      // Get total Top 100 courses
      const { count: totalTop100 } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true })
        .not('global_rank', 'is', null)
        .lte('global_rank', 100);

      // Get played Top 100 courses
      const { count: playedTop100 } = await supabase
        .from('user_courses')
        .select(`
          golf_courses!inner(global_rank)
        `, { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .eq('played', true)
        .not('golf_courses.global_rank', 'is', null)
        .lte('golf_courses.global_rank', 100);

      return {
        total: totalTop100 || 0,
        played: playedTop100 || 0,
      };
    },
    enabled: !!user?.user,
  });

  if (!user?.user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign in to track your courses</h3>
          <p className="text-muted-foreground">
            Create an account to track which courses you've played and manage your golf journey
          </p>
        </CardContent>
      </Card>
    );
  }

  const playedCourses = userCourses?.filter(uc => uc.played) || [];
  const wishlistCourses = userCourses?.filter(uc => !uc.played) || [];
  const top100Progress = top100Stats ? (top100Stats.played / top100Stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">My Golf Journey</h2>
        <p className="text-muted-foreground">Track your progress and discover new courses</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{playedCourses.length}</div>
            <div className="text-sm text-muted-foreground">Courses Played</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{wishlistCourses.length}</div>
            <div className="text-sm text-muted-foreground">Wishlist</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{top100Stats?.played || 0}</div>
            <div className="text-sm text-muted-foreground">Top 100 Played</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 100 Progress */}
      {top100Stats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Top 100 Progress</h3>
              <Badge variant="secondary">
                {top100Stats.played}/{top100Stats.total}
              </Badge>
            </div>
            <Progress value={top100Progress} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              {top100Progress.toFixed(1)}% of the world's Top 100 courses completed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Course Tabs */}
      <Tabs defaultValue="played" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="played">
            Played ({playedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            Wishlist ({wishlistCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="played" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : playedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playedCourses.map((userCourse) => (
                <div key={userCourse.id} className="relative">
                  <CourseCard course={userCourse.golf_courses} />
                  {userCourse.played_date && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(userCourse.played_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No courses played yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring and mark courses you've played
                </p>
                <Button variant="outline">Explore Courses</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : wishlistCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistCourses.map((userCourse) => (
                <CourseCard key={userCourse.id} course={userCourse.golf_courses} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No courses in wishlist</h3>
                <p className="text-muted-foreground mb-4">
                  Add courses to your wishlist to track where you want to play
                </p>
                <Button variant="outline">Browse Courses</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyCourses;
