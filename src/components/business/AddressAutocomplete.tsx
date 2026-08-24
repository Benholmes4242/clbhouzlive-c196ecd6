import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppLog } from '@/lib/logger';

export type LocationPrecision = 'address' | 'poi' | 'postcode' | 'city' | 'region' | 'country' | 'pin' | 'unknown';

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
  countryCode: string; // Required - ISO2 code
  countryDisplayName?: string; // For helper text
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

interface AddressResult {
  label: string;
  lat: number;
  lng: number;
  place_id: string;
  precision: string;
  primary: string;
  secondary: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  postcode?: string | null;
}

interface AddressSearchResponse {
  results: AddressResult[];
  error?: string;
}

// Check if precision is precise enough
function isPreciseEnough(precision: LocationPrecision): boolean {
  return ['address', 'poi', 'pin'].includes(precision);
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onDropPinClick,
  countryCode,
  countryDisplayName,
  placeholder = 'Start typing street, postcode/ZIP, or area…',
  className,
  disabled = false,
  error,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
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
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    if (!countryCode) {
      setSearchError('Please select a country first');
      return;
    }

    setLoading(true);
    setSearchError(null);
    
    try {
      const response = await fetch(
        `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/address-search?q=${encodeURIComponent(searchQuery)}&country=${countryCode}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data: AddressSearchResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSuggestions(data.results || []);
      setShowDropdown(true);
      
      if (data.results?.length === 0) {
        // No results, but not an error
        setSearchError(null);
      }
    } catch (err) {
      AppLog.error('[AddressAutocomplete]', 'Address search error:', err);
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
    
    if (newQuery.length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchLocations(newQuery);
      }, 400); // 400ms debounce
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (result: AddressResult) => {
    const addressValue: AddressValue = {
      label: result.label,
      lat: result.lat,
      lng: result.lng,
      mapboxPlaceId: result.place_id,
      precision: (['address', 'poi', 'postcode', 'city', 'region', 'country', 'pin', 'unknown'].includes(result.precision)
        ? result.precision
        : 'unknown') as LocationPrecision,
      countryCode: countryCode,
      // Use structured data from edge function
      city: result.city || undefined,
      region: result.region || undefined,
      country: result.country || undefined,
      postcode: result.postcode || undefined,
    };

    onChange(addressValue);
    setQuery(result.label);
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
          disabled={disabled || !countryCode}
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

      {/* Helper text - cleaner copy */}
      {!showError && !showPrecisionWarning && countryCode && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            Add your street address and postcode/ZIP so your map pin is accurate.
          </p>
          {countryDisplayName && (
            <p className="text-[11px] text-muted-foreground/70">
              Searching within {countryDisplayName}.
            </p>
          )}
        </div>
      )}
      
      {!countryCode && (
        <p className="text-xs text-muted-foreground mt-2">
          Select a country first to enable address search.
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
        <div className="mt-3 p-3 rounded-sq-sm bg-muted border border-border/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-[#f59e0b] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">That location is too general</p>
              <p className="text-xs text-foreground mt-0.5">
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
      {!value && onDropPinClick && countryCode && (
        <button
          type="button"
          onClick={onDropPinClick}
          className="text-xs text-[#d97706] hover:underline mt-1.5 block"
        >
          Can't find your exact address? Drop a pin
        </button>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg max-h-60 overflow-auto">
          {suggestions.map((result) => {
            const isPrecise = isPreciseEnough(result.precision as LocationPrecision);
            
            return (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors flex items-start gap-2"
              >
                <MapPin className={cn(
                  "h-4 w-4 shrink-0 mt-0.5",
                  isPrecise ? "text-[#d97706]" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.primary}</p>
                  {result.secondary && (
                    <p className="text-xs text-muted-foreground truncate">{result.secondary}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results state */}
      {showDropdown && query.length >= 3 && suggestions.length === 0 && !loading && !searchError && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            No results — try adding postcode/ZIP
          </p>
          {onDropPinClick && (
            <p className="text-xs text-muted-foreground/70 text-center mt-1">
              Or{' '}
              <button
                type="button"
                onClick={onDropPinClick}
                className="text-[#d97706] hover:underline"
              >
                drop a pin on the map
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
