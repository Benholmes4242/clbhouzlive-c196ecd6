import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LocationPrecision = 'address' | 'poi' | 'postcode' | 'city' | 'region' | 'country' | 'pin';

export interface AddressValue {
  label: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  mapboxPlaceId?: string;
  precision: LocationPrecision;
}

interface AddressAutocompleteProps {
  value?: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  onDropPinClick?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  place_type: string[];
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  center: [number, number];
  properties?: {
    address?: string;
  };
  address?: string;
}

interface MapboxResponse {
  type: string;
  features: MapboxFeature[];
  attribution?: string;
  error?: string;
}

// Determine precision from Mapbox place_type
function determinePrecision(placeTypes: string[]): LocationPrecision {
  if (placeTypes.includes('address')) return 'address';
  if (placeTypes.includes('poi')) return 'poi';
  if (placeTypes.includes('postcode')) return 'postcode';
  if (placeTypes.includes('place') || placeTypes.includes('locality')) return 'city';
  if (placeTypes.includes('region')) return 'region';
  if (placeTypes.includes('country')) return 'country';
  return 'city';
}

// Check if precision is precise enough
function isPreciseEnough(precision: LocationPrecision): boolean {
  return ['address', 'poi', 'pin'].includes(precision);
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onDropPinClick,
  placeholder = 'Start typing street, postcode/ZIP, or area…',
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
      // Use address-specific search for better results
      const response = await fetch(
        `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/address-search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        // Fallback to location-search if address-search doesn't exist
        const fallbackResponse = await fetch(
          `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/location-search?q=${encodeURIComponent(searchQuery)}&types=address,poi,postcode,place`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!fallbackResponse.ok) {
          throw new Error(`API error: ${fallbackResponse.status}`);
        }
        
        const fallbackData: MapboxResponse = await fallbackResponse.json();
        if (fallbackData.features && Array.isArray(fallbackData.features)) {
          setSuggestions(fallbackData.features);
          setShowDropdown(true);
        }
        return;
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
    } catch (err) {
      console.error('Address search error:', err);
      setSearchError('Unable to search addresses. Please try again.');
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
    // Parse the Mapbox feature into our AddressValue format
    let addressLine1: string | undefined;
    let city: string | undefined;
    let region: string | undefined;
    let postcode: string | undefined;
    let country: string | undefined;
    let countryCode: string | undefined;

    // Try to extract street address from feature
    if (feature.address) {
      addressLine1 = `${feature.address} ${feature.text}`;
    } else if (feature.properties?.address) {
      addressLine1 = feature.properties.address;
    }

    // Parse context for location components
    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('place') || ctx.id.startsWith('locality')) {
          city = ctx.text;
        }
        if (ctx.id.startsWith('region')) {
          region = ctx.text;
        }
        if (ctx.id.startsWith('postcode')) {
          postcode = ctx.text;
        }
        if (ctx.id.startsWith('country')) {
          country = ctx.text;
          countryCode = ctx.short_code?.toUpperCase();
        }
      }
    }

    // If the feature itself is a place type, use it as city
    if (!city && (feature.place_type.includes('place') || feature.place_type.includes('locality'))) {
      city = feature.text;
    }

    const precision = determinePrecision(feature.place_type);

    const addressValue: AddressValue = {
      label: feature.place_name,
      addressLine1,
      city,
      region,
      postcode,
      country,
      countryCode,
      lng: feature.center[0],
      lat: feature.center[1],
      mapboxPlaceId: feature.id,
      precision,
    };

    onChange(addressValue);
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

  const handleRefine = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  // Display the selected value or the query
  const displayValue = value ? value.label : query;
  const showError = error || (searchError && !loading);
  const showPrecisionWarning = value && !isPreciseEnough(value.precision);

  // Format suggestion for display
  const formatSuggestion = (feature: MapboxFeature) => {
    const parts = feature.place_name.split(', ');
    const primary = parts[0];
    const secondary = parts.slice(1).join(', ');
    return { primary, secondary };
  };

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
            value && "text-foreground",
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

      {/* Helper text */}
      {!showError && !showPrecisionWarning && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Use your full address (street + postcode/ZIP) so golfers can find you.
        </p>
      )}

      {/* Error message */}
      {showError && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error || searchError}
        </p>
      )}

      {/* Precision warning */}
      {showPrecisionWarning && (
        <div className="mt-3 p-3 rounded-sq-sm bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">That location is too general</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add a street address or postcode/ZIP to place your map pin accurately.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefine}
                  className="h-7 text-xs"
                >
                  Refine address
                </Button>
                {onDropPinClick && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDropPinClick}
                    className="h-7 text-xs"
                  >
                    Drop a pin on map
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drop pin link */}
      {!value && onDropPinClick && (
        <button
          type="button"
          onClick={onDropPinClick}
          className="text-xs text-primary hover:underline mt-1.5 block"
        >
          Can't find your exact address? Drop a pin
        </button>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg max-h-60 overflow-auto">
          {suggestions.map((feature) => {
            const { primary, secondary } = formatSuggestion(feature);
            const precision = determinePrecision(feature.place_type);
            const isPrecise = isPreciseEnough(precision);
            
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleSelect(feature)}
                className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors flex items-start gap-2"
              >
                <MapPin className={cn(
                  "h-4 w-4 shrink-0 mt-0.5",
                  isPrecise ? "text-emerald-600" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{primary}</p>
                  {secondary && (
                    <p className="text-xs text-muted-foreground truncate">{secondary}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results state */}
      {showDropdown && query.length >= 2 && suggestions.length === 0 && !loading && !searchError && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            No addresses found for "{query}"
          </p>
          <p className="text-xs text-muted-foreground/70 text-center mt-1">
            Try a different search term or{' '}
            {onDropPinClick && (
              <button
                type="button"
                onClick={onDropPinClick}
                className="text-primary hover:underline"
              >
                drop a pin on the map
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
