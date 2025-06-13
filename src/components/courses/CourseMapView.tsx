
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Trophy, Search, Globe } from 'lucide-react';

// Note: This is a placeholder for the map view
// In a real implementation, you would use Mapbox or Google Maps
const CourseMapView = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses-with-location', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('global_rank', { ascending: true, nullsLast: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Course Map</h2>
        <p className="text-muted-foreground">Explore golf courses around the world</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search courses on map..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Map Placeholder */}
      <Card className="h-96 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Globe className="h-16 w-16 mx-auto text-green-600" />
            <div>
              <h3 className="text-lg font-semibold">Interactive Map Coming Soon</h3>
              <p className="text-muted-foreground">
                Explore golf courses on an interactive world map with course pins and detailed views
              </p>
            </div>
            <Button variant="outline" disabled>
              <MapPin className="h-4 w-4 mr-2" />
              Map Integration Required
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course List for Map View */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Courses with Coordinates ({courses?.length || 0})</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{course.name}</h4>
                        {course.global_rank && (
                          <Badge variant="secondary">
                            <Trophy className="h-3 w-3 mr-1" />
                            #{course.global_rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{course.region ? `${course.region}, ` : ''}{course.country}</span>
                        <span className="ml-3 font-mono text-xs">
                          {course.latitude?.toFixed(4)}, {course.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No courses found with coordinates</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseMapView;
