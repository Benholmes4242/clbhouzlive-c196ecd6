
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Globe, Map as MapIcon } from 'lucide-react';

interface Course {
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
}

const Top100Courses = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Global Top 100
  const { data: globalTop100, isLoading: loadingGlobal } = useQuery({
    queryKey: ['global-top-100'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .not('global_rank', 'is', null)
        .lte('global_rank', 100)
        .order('global_rank', { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
  });

  // Regional Top 100
  const { data: regionalTop100, isLoading: loadingRegional } = useQuery({
    queryKey: ['regional-top-100', selectedRegion],
    queryFn: async () => {
      if (!selectedRegion) return [];

      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .eq('continent', selectedRegion)
        .not('regional_rank', 'is', null)
        .lte('regional_rank', 100)
        .order('regional_rank', { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
    enabled: !!selectedRegion,
  });

  const continents = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {globalTop100.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No Top 100 courses found</p>
              </div>
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
                    {continents.map((continent) => (
                      <SelectItem key={continent} value={continent}>
                        {continent}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionalTop100.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No courses found for {selectedRegion}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Top100Courses;
