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

interface CourseCountrySelectorProps {
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
  className?: string;
}

/**
 * CourseCountrySelector - Lists countries where golf courses are located
 * (Different from CountrySelector which lists countries where users are located)
 */
export const CourseCountrySelector: React.FC<CourseCountrySelectorProps> = ({
  selectedCountry,
  onCountrySelect,
  className = '',
}) => {
  const { data: countries, isLoading } = useQuery({
    queryKey: ['course-countries'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_countries');

      if (error) {
        console.error('Error fetching course countries:', error);
        throw error;
      }

      return data?.map(c => c.country_name) || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className={`h-11 w-full bg-muted/50 animate-pulse rounded-lg ${className}`} />
    );
  }

  return (
    <Select
      value={selectedCountry || ''}
      onValueChange={(value) => onCountrySelect(value || null)}
    >
      <SelectTrigger className={`w-full min-h-[44px] bg-white border-[#e2e8f0] ${className}`}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="Select a country..." />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white z-50 max-h-[300px]">
        {countries?.map((country) => (
          <SelectItem 
            key={country} 
            value={country}
            className="cursor-pointer"
          >
            {country}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
