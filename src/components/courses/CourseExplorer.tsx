
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, Upload } from 'lucide-react';
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
  usa_rank: number | null;
  description: string;
  thumbnail_image: string;
  latitude: number | null;
  longitude: number | null;
}

const CourseExplorer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [top100Only, setTop100Only] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', searchTerm, selectedRegion, selectedCountry, top100Only],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('*');

      // Set initial ordering based on region
      if (selectedRegion === 'USA') {
        query = query.order('usa_rank', { ascending: true, nullsFirst: false });
      } else if (selectedRegion === 'Britain & Ireland') {
        query = query.order('regional_rank', { ascending: true, nullsFirst: false });
      } else {
        query = query.order('global_rank', { ascending: true, nullsFirst: false });
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`);
      }

      if (selectedRegion) {
        if (selectedRegion === 'Britain & Ireland') {
          query = query.in('country', ['United Kingdom', 'Ireland']);
        } else if (selectedRegion === 'Europe') {
          query = query.eq('continent', 'Europe').not('country', 'in', '("United Kingdom","Ireland")');
        } else if (selectedRegion === 'USA') {
          query = query.eq('country', 'United States');
        }
        // For 'Worldwide', no filter is applied
      }

      if (selectedCountry) {
        query = query.eq('country', selectedCountry);
      }

      if (top100Only) {
        if (selectedRegion === 'USA') {
          query = query.not('usa_rank', 'is', null).lte('usa_rank', 100);
        } else if (selectedRegion === 'Britain & Ireland') {
          query = query.not('regional_rank', 'is', null).lte('regional_rank', 100);
        } else if (selectedRegion === 'Worldwide') {
          // For worldwide, only show courses with global ranks 1-100
          query = query.not('global_rank', 'is', null).gte('global_rank', 1).lte('global_rank', 100);
        } else {
          query = query.not('global_rank', 'is', null).lte('global_rank', 100);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: countries } = useQuery({
    queryKey: ['countries', selectedRegion],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('country')
        .order('country');

      if (selectedRegion) {
        if (selectedRegion === 'Britain & Ireland') {
          query = query.in('country', ['United Kingdom', 'Ireland']);
        } else if (selectedRegion === 'Europe') {
          query = query.eq('continent', 'Europe').not('country', 'in', '("United Kingdom","Ireland")');
        } else if (selectedRegion === 'USA') {
          query = query.eq('country', 'United States');
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      const uniqueCountries = [...new Set(data.map(item => item.country))];
      return uniqueCountries;
    },
  });

  const regions = ['Britain & Ireland', 'Europe', 'USA', 'Worldwide'];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRegion('');
    setSelectedCountry('');
    setTop100Only(false);
  };

  const hasActiveFilters = searchTerm || selectedRegion || selectedCountry || top100Only;

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
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedRegion && selectedRegion !== 'Worldwide' && countries && countries.length > 0 && (
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
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
            {selectedRegion && (
              <Badge variant="secondary">{selectedRegion}</Badge>
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
        <Card>
          <CardContent className="p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No golf courses found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? "No courses match your current filters. Try adjusting your search criteria."
                : "No golf courses have been added yet. Use the import tools to add course data."
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseExplorer;
