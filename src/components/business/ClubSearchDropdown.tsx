import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useClubSearch, GolfClub } from '@/hooks/useClubSearch';
import { getFlagCode } from '@/utils/countryFlags';
import { cn } from '@/lib/utils';

export interface SelectedClub {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  sub_country: string | null;
  club_key: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface ClubSearchDropdownProps {
  value: SelectedClub | null;
  onChange: (club: SelectedClub | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Reusable club search dropdown backed by golf_clubs table.
 * Used for Golf Club category business creation and home club selection.
 */
export const ClubSearchDropdown: React.FC<ClubSearchDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search for a golf club...',
  disabled = false,
  error,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, loading } = useClubSearch(searchQuery, {
    debounceMs: 250,
    limit: 10,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (club: GolfClub) => {
    onChange({
      id: club.id,
      name: club.name,
      country: club.country,
      region: club.region,
      sub_country: club.sub_country,
      club_key: club.club_key,
      latitude: club.latitude,
      longitude: club.longitude,
    });
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };

  const formatLocation = (club: GolfClub) => {
    return [club.sub_country, club.region, club.country].filter(Boolean).join(', ');
  };

  if (disabled) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/50 opacity-60",
        className
      )}>
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-muted-foreground">Select a category first</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {value ? (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2.5 border rounded-sq-sm bg-muted/30",
          error ? "border-destructive" : "border-border"
        )}>
          {(() => {
            const flagCode = value.country ? getFlagCode(value.country) : null;
            return flagCode ? (
              <img
                src={`https://flagcdn.com/w20/${flagCode}.png`}
                alt={value.country}
                className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null;
          })()}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{value.name}</div>
            {(value.sub_country || value.country) && (
              <div className="text-xs text-muted-foreground truncate">
                {[value.sub_country, value.country].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className={cn(
                "pl-10 h-10",
                error && "border-destructive focus-visible:ring-destructive"
              )}
            />
          </div>

          {/* Dropdown */}
          {isOpen && searchQuery.length >= 2 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-sq-sm shadow-lg max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">No clubs found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {searchResults.map((club) => (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => handleSelect(club)}
                      className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      {(() => {
                        const flagCode = club.country ? getFlagCode(club.country) : null;
                        return flagCode ? (
                          <img
                            src={`https://flagcdn.com/w20/${flagCode}.png`}
                            alt={club.country}
                            className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null;
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {club.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatLocation(club)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};