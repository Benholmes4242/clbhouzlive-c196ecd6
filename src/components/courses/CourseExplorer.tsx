
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';

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

const CourseExplorer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [top100Only, setTop100Only] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', searchTerm, selectedContinent, selectedCountry, top100Only],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('*')
        .order('global_rank', { ascending: true, nullsLast: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`);
      }

      if (selectedContinent) {
        query = query.eq('continent', selectedContinent);
      }

      if (selectedCountry) {
        query = query.eq('country', selectedCountry);
      }

      if (top100Only) {
        query = query.not('global_rank', 'is', null).lte('global_rank', 100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: countries } = useQuery({
    queryKey: ['countries', selectedContinent],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('country')
        .order('country');

      if (selectedContinent) {
        query = query.eq('continent', selectedContinent);
      }

      const { data, error } = await query;
      if (error) throw error;
      const uniqueCountries = [...new Set(data.map(item => item.country))];
      return uniqueCountries;
    },
  });

  const continents = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedContinent('');
    setSelectedCountry('');
    setTop100Only(false);
  };

  const hasActiveFilters = searchTerm || selectedContinent || selectedCountry || top100Only;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses by name, country, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={selectedContinent} onValueChange={setSelectedContinent}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Continent" />
            </SelectTrigger>
            <SelectContent>
              {continents.map((continent) => (
                <SelectItem key={continent} value={continent}>
                  {continent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedContinent && (
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countries?.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant={top100Only ? "default" : "outline"}
            onClick={() => setTop100Only(!top100Only)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Top 100 Only
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary">Search: {searchTerm}</Badge>
            )}
            {selectedContinent && (
              <Badge variant="secondary">{selectedContinent}</Badge>
            )}
            {selectedCountry && (
              <Badge variant="secondary">{selectedCountry}</Badge>
            )}
            {top100Only && (
              <Badge variant="secondary">Top 100</Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No courses found matching your criteria</p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear filters to see all courses
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseExplorer;
