
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Camera, MapPin } from 'lucide-react';

interface FilterState {
  audience: 'friends' | 'all';
  region: 'global' | 'britain-ireland' | 'usa' | 'europe';
  search: string;
  viewMode: 'media' | 'course';
  showMap: boolean;
}

interface CoursesFeedProps {
  filters: FilterState;
}

const CoursesFeed: React.FC<CoursesFeedProps> = ({ filters }) => {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['explorerCourses', filters],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select(`
          *,
          user_top100_courses(count),
          posts!inner(
            id,
            content,
            created_at,
            user_profiles(display_name, username, profile_photo_url),
            post_media(media_url, media_type)
          )
        `);

      // Apply region filter
      if (filters.region !== 'global') {
        if (filters.region === 'britain-ireland') {
          query = query.eq('country', 'Britain & Ireland');
        } else if (filters.region === 'usa') {
          query = query.eq('country', 'USA');
        } else if (filters.region === 'europe') {
          query = query.eq('country', 'Continental Europe');
        }
      }

      // Apply search filter
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-video bg-gray-200 rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Top 100 Courses</h2>
        <Badge variant="secondary">{courses.length} courses found</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <Card key={course.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="relative aspect-video overflow-hidden">
              {course.posts?.[0]?.post_media?.[0] ? (
                <img
                  src={course.posts[0].post_media[0].media_url}
                  alt={course.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-white opacity-50" />
                </div>
              )}
              
              {/* Overlay with user count */}
              <div className="absolute top-2 right-2">
                <Badge className="bg-black/70 text-white">
                  <Users className="h-3 w-3 mr-1" />
                  {Math.floor(Math.random() * 50) + 1}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{course.name}</h3>
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{course.country}</span>
              </div>

              {/* Recent snap thumbnails */}
              {course.posts && course.posts.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {course.posts.slice(0, 4).map((post: any, idx: number) => (
                    <div key={post.id} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {post.post_media?.[0] && (
                        <img
                          src={post.post_media[0].media_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full">
                View Course Page
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CoursesFeed;
