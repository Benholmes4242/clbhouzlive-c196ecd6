import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedCourseCard } from './UnifiedCourseCard';
import { fromGolfCourse, GolfCourseRaw } from '@/lib/mappers/toCourseCardModel';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Globe, Map as MapIcon, Upload } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  description: string;
  thumbnail_image: string;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
}

const Top100Courses = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Global Top 100 - only courses with actual global rankings 1-100
  const { data: globalTop100, isLoading: loadingGlobal } = useQuery({
    queryKey: ['global-top-100'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .not('global_rank', 'is', null)
        .gte('global_rank', 1)
        .lte('global_rank', 100)
        .order('global_rank', { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
  });

  // Regional Top 100 - updated logic based on primary country selection
  const { data: regionalTop100, isLoading: loadingRegional } = useQuery({
    queryKey: ['regional-top-100', selectedRegion],
    queryFn: async () => {
      if (!selectedRegion) return [];

      let query = supabase
        .from('golf_courses')
        .select('*');

      if (selectedRegion === 'Britain & Ireland') {
        // Show courses where primary country is "Britain & Ireland" and have regional rank
        query = query
          .eq('country', 'Britain & Ireland')
          .not('regional_rank', 'is', null)
          .lte('regional_rank', 100)
          .order('regional_rank', { ascending: true });
      } else if (selectedRegion === 'USA') {
        // Show courses where primary country is "USA" and have regional rank
        query = query
          .eq('country', 'USA')
          .not('regional_rank', 'is', null)
          .lte('regional_rank', 100)
          .order('regional_rank', { ascending: true });
      } else if (selectedRegion === 'Continental Europe') {
        // Show courses where primary country is "Continental Europe" and have regional rank
        query = query
          .eq('country', 'Continental Europe')
          .not('regional_rank', 'is', null)
          .lte('regional_rank', 100)
          .order('regional_rank', { ascending: true });
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!selectedRegion,
  });

  const regions = ['Britain & Ireland', 'USA', 'Continental Europe'];

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <Card>
      <CardContent className="p-8 text-center">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Top 100 Golf Courses</h2>
        <p className="text-muted-foreground">The world's most prestigious golf courses</p>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global Top 100
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            By Region
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h3 className="text-xl font-semibold">World's Top 100</h3>
              </div>
              <p className="text-muted-foreground">
                The definitive ranking of the world's greatest golf courses
              </p>
            </div>

            {loadingGlobal ? (
              <LoadingSkeleton />
            ) : globalTop100 && globalTop100.length > 0 ? (
              <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                  {globalTop100.map((course) => (
                    <div key={course.id} className="mb-0">
                      <UnifiedCourseCard
                        course={fromGolfCourse(course as unknown as GolfCourseRaw)}
                        showRankBadges={true}
                        showRating={true}
                        showPlayedStatus={false}
                        activeListSlug="global"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState 
                title="No Top 100 courses found"
                description="Import golf course data to see the world's top 100 courses"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="regional" className="mt-6">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Regional Top 100</h3>
              <div className="max-w-xs mx-auto">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedRegion ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a region to view the top courses</p>
              </div>
            ) : loadingRegional ? (
              <LoadingSkeleton />
            ) : regionalTop100 && regionalTop100.length > 0 ? (
              <div className="space-y-4">
                {selectedRegion === 'Britain & Ireland' && (
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-green-700">GB&I Top 100</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete ranking of Great Britain & Ireland's finest courses
                    </p>
                  </div>
                )}
                {selectedRegion === 'USA' && (
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-blue-700">USA Top 100</h4>
                    <p className="text-sm text-muted-foreground">
                      The finest golf courses across the United States
                    </p>
                  </div>
                )}
                {selectedRegion === 'Continental Europe' && (
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-purple-700">Continental Europe Top 100</h4>
                    <p className="text-sm text-muted-foreground">
                      Premier golf courses across Continental Europe
                    </p>
                  </div>
                )}
                <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {regionalTop100.map((course) => (
                      <div key={course.id} className="mb-0">
                        <UnifiedCourseCard
                          course={fromGolfCourse(course as unknown as GolfCourseRaw)}
                          showRankBadges={true}
                          showRating={true}
                          showPlayedStatus={false}
                          activeListSlug={selectedRegion === 'USA' ? 'usa' : selectedRegion === 'Britain & Ireland' ? 'gb-i' : 'europe'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState 
                title={`No courses found for ${selectedRegion}`}
                description="Add courses with regional rankings to see them in this list"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100Courses;
