import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  error?: string;
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

interface MapboxResponse {
  type: string;
  features: MapboxFeature[];
  attribution?: string;
  error?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
  disabled = false,
  error,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
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
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);
    
    try {
      // Call our edge function that securely uses the Mapbox token
      const { data, error } = await supabase.functions.invoke('location-search', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      });

      // Since invoke doesn't support query params directly, we need to use fetch
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://ybxkehyomcakqjvuhnna.supabase.co'}/functions/v1/location-search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        console.error('Location search API error:', response.status);
        throw new Error(`API error: ${response.status}`);
      }
      
      const responseData: MapboxResponse = await response.json();
      
      if (responseData.error) {
        throw new Error(responseData.error);
      }
      
      if (responseData.features && Array.isArray(responseData.features)) {
        setSuggestions(responseData.features);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSearchError('Unable to search locations. Please try again.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSearchError(null);
    
    // Clear the selected value when user starts typing
    if (value) {
      onChange(null);
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (newQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchLocations(newQuery);
      }, 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
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

    // If no country in context, the feature itself might be the country
    if (!country && feature.id.startsWith('country')) {
      country = feature.text;
      const countryCtx = feature.context?.find(c => c.id.startsWith('country'));
      countryCode = countryCtx?.short_code?.toUpperCase() || '';
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
    setSearchError(null);
  };

  const handleClear = () => {
    setQuery('');
    onChange(null);
    setSuggestions([]);
    setShowDropdown(false);
    setSearchError(null);
    inputRef.current?.focus();
  };

  // Display the selected value or the query
  const displayValue = value ? value.label : query;
  const showError = error || (searchError && !loading);

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
          className={cn(
            "pl-9 pr-9 h-10",
            showError && "border-destructive focus-visible:ring-destructive"
          )}
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

      {/* Error message */}
      {showError && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error || searchError}
        </p>
      )}

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
      {showDropdown && query.length >= 2 && suggestions.length === 0 && !loading && !searchError && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            No locations found for "{query}"
          </p>
          <p className="text-xs text-muted-foreground/70 text-center mt-1">
            Try a different search term
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
