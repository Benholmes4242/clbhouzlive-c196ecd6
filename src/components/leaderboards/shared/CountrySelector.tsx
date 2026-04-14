import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeaderboardCountries } from '@/hooks/leaderboards/useLeaderboardCountries';
import { MapPin } from 'lucide-react';

interface CountrySelectorProps {
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onCountrySelect,
  className = '',
}) => {
  const { data: countries, isLoading } = useLeaderboardCountries();

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
      <SelectTrigger
        className={`w-full min-h-[44px] active:scale-[0.98] transition-transform ${className}`}
        style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)' }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="Select a country..." />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-card z-50 max-h-[300px]">
        {countries?.map((country) => (
          <SelectItem 
            key={country.country_code} 
            value={country.country_code}
            className="cursor-pointer"
          >
            {country.country_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};