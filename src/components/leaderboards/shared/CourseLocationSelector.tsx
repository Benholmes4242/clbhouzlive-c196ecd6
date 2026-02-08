import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface CourseLocationSelectorProps {
  selectedRegion: string | null;
  selectedSubRegion: string | null;
  onRegionChange: (region: string | null) => void;
  onSubRegionChange: (subRegion: string | null) => void;
  className?: string;
}

/**
 * CourseLocationSelector - Two-dropdown system for filtering courses by Region and Sub-Region
 * Region = golf regions (Britain & Ireland, USA, Continental Europe, etc.)
 * Sub-Region = countries/states within those regions (England, Scotland, California, etc.)
 */
export const CourseLocationSelector: React.FC<CourseLocationSelectorProps> = ({
  selectedRegion,
  selectedSubRegion,
  onRegionChange,
  onSubRegionChange,
  className = '',
}) => {
  // Fetch regions
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['course-regions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_regions');

      if (error) {
        console.error('Error fetching course regions:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch sub-regions when a region is selected
  const { data: subRegions, isLoading: subRegionsLoading } = useQuery({
    queryKey: ['course-sub-regions', selectedRegion],
    queryFn: async () => {
      if (!selectedRegion) return [];
      
      const { data, error } = await supabase.rpc('get_course_sub_regions', {
        p_region: selectedRegion
      });

      if (error) {
        console.error('Error fetching course sub-regions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!selectedRegion,
    staleTime: 5 * 60 * 1000,
  });

  const handleRegionChange = (value: string) => {
    const newRegion = value === '__all__' ? null : value;
    onRegionChange(newRegion);
    onSubRegionChange(null); // Reset sub-region when region changes
  };

  const handleSubRegionChange = (value: string) => {
    onSubRegionChange(value === '__all__' ? null : value);
  };

  if (regionsLoading) {
    return (
      <div className={`flex gap-3 ${className}`}>
        <div className="flex-1 h-11 bg-muted/50 animate-pulse rounded-lg" />
        <div className="flex-1 h-11 bg-muted/50 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Region Dropdown */}
      <Select
        value={selectedRegion || ''}
        onValueChange={handleRegionChange}
      >
        <SelectTrigger className="flex-1 min-h-[44px] bg-card border-border active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <SelectValue placeholder="All Regions" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card z-50 max-h-[300px]">
          <SelectItem value="__all__" className="cursor-pointer">
            All Regions
          </SelectItem>
          {regions
            ?.filter((r: { region_name: string }) => r.region_name?.trim())
            .map((region: { region_name: string; course_count: number }) => (
              <SelectItem 
                key={region.region_name} 
                value={region.region_name}
                className="cursor-pointer"
              >
                {region.region_name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Sub-Region Dropdown */}
      <Select
        value={selectedSubRegion || ''}
        onValueChange={handleSubRegionChange}
        disabled={!selectedRegion}
      >
        <SelectTrigger 
          className={`flex-1 min-h-[44px] bg-card border-border active:scale-[0.98] transition-transform ${
            !selectedRegion ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <SelectValue placeholder="All sub-regions" />
        </SelectTrigger>
        <SelectContent className="bg-card z-50 max-h-[300px]">
          <SelectItem value="__all__" className="cursor-pointer">
            All sub-regions
          </SelectItem>
          {subRegionsLoading ? (
            <SelectItem value="_loading" disabled className="text-muted-foreground">
              Loading...
            </SelectItem>
          ) : (
            subRegions
              ?.filter((sr: { sub_region_name: string }) => sr.sub_region_name?.trim())
              .map((subRegion: { sub_region_name: string; course_count: number }) => (
                <SelectItem 
                  key={subRegion.sub_region_name} 
                  value={subRegion.sub_region_name}
                  className="cursor-pointer"
                >
                  {subRegion.sub_region_name}
                </SelectItem>
              ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
