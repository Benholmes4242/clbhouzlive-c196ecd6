import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface LocationValue {
  label: string;
  city: string;
  region?: string;
  country: string;
  countryCode: string;
  lat?: number;
  lng?: number;
}

interface LocationAutocompleteProps {
  value?: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  center: [number, number];
}

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiY2xiaG91eiIsImEiOiJjbTRsNGplOTEweHNuMmxzZXRlaWFzYWFoIn0.zdM-1W-rbIrRLAXMdl3hgA';

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${MAPBOX_ACCESS_TOKEN}&types=place,locality,region&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Clear the selected value when user starts typing
    if (value) {
      onChange(null);
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  const handleSelect = (feature: MapboxFeature) => {
    // Parse the Mapbox feature into our LocationValue format
    let city = feature.text;
    let region: string | undefined;
    let country = '';
    let countryCode = '';

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('region')) {
          region = ctx.text;
        }
        if (ctx.id.startsWith('country')) {
          country = ctx.text;
          countryCode = ctx.short_code?.toUpperCase() || '';
        }
      }
    }

    const locationValue: LocationValue = {
      label: feature.place_name,
      city,
      region,
      country,
      countryCode,
      lng: feature.center[0],
      lat: feature.center[1],
    };

    onChange(locationValue);
    setQuery(feature.place_name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setQuery('');
    onChange(null);
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Display the selected value or the query
  const displayValue = value ? value.label : query;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="pl-9 pr-9 h-10"
          disabled={disabled}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!loading && (value || query) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg max-h-60 overflow-auto">
          {suggestions.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleSelect(feature)}
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-start gap-2"
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="line-clamp-2">{feature.place_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results state */}
      {showDropdown && query.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            No locations found
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
