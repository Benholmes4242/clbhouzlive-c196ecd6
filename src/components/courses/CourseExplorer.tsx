
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';

const CourseExplorer = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch courses based on selected region using correct filtering logic
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', selectedRegion],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('*');

      if (selectedRegion === 'all') {
        // Show all courses in randomized order - no filtering needed
        query = query.order('created_at', { ascending: false });
      } else if (selectedRegion === 'britain-ireland') {
        // Show courses where primary country is "Britain & Ireland" and have regional rank
        query = query
          .eq('country', 'Britain & Ireland')
          .not('regional_rank', 'is', null)
          .order('regional_rank', { ascending: true });
      } else if (selectedRegion === 'usa') {
        // Show courses where primary country is "USA" and have regional rank
        query = query
          .eq('country', 'USA')
          .not('regional_rank', 'is', null)
          .order('regional_rank', { ascending: true });
      } else if (selectedRegion === 'europe') {
        // Show courses where primary country is "Continental Europe" and have regional rank
        query = query
          .eq('country', 'Continental Europe')
          .not('regional_rank', 'is', null)
          .order('regional_rank', { ascending: true });
      } else if (selectedRegion === 'global') {
        // Global - show all courses with global ranks
        query = query
          .not('global_rank', 'is', null)
          .order('global_rank', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const regionOptions = [
    { value: 'all', label: 'All Courses' },
    { value: 'britain-ireland', label: 'Britain & Ireland' },
    { value: 'usa', label: 'United States' },
    { value: 'europe', label: 'Continental Europe' },
    { value: 'global', label: 'Worldwide' }
  ];

  const currentRegion = regionOptions.find(r => r.value === selectedRegion);

  // Map selectedRegion to viewContext
  const getViewContext = () => {
    switch (selectedRegion) {
      case 'britain-ireland':
        return 'regional';
      case 'usa':
        return 'usa';
      case 'europe':
        return 'europe';  
      case 'global':
        return 'global';
      default:
        return 'global';
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search courses, countries, or regions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-border focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#b66b41]"
        />
      </div>

      {/* Region Selection */}
      <div className="flex items-center gap-4">
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[200px] focus:ring-[#b66b41] focus:border-[#b66b41]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {regionOptions.map((region) => (
              <SelectItem 
                key={region.value} 
                value={region.value}
                className="hover:text-[#b66b41] focus:text-[#b66b41]"
              >
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              viewContext={getViewContext()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? `No courses match "${searchTerm}" in ${currentRegion?.label}`
              : `No courses available for ${currentRegion?.label}`
            }
          </p>
        </div>
      )}

    </div>
  );
};

export default CourseExplorer;
