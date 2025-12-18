import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClubSearch } from '@/hooks/useClubSearch';
import { getFlagCode } from '@/utils/countryFlags';

interface GolfInfoSectionProps {
  homeClub: string;
  homeClubId: string | null;
  handicap: string;
  onChange: (field: string, value: string | null) => void;
}

export const GolfInfoSection: React.FC<GolfInfoSectionProps> = ({
  homeClub,
  homeClubId,
  handicap,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Query golf_clubs (parent entities) instead of golf_courses
  const { data: searchResults, loading } = useClubSearch(searchQuery, {
    debounceMs: 250,
    limit: 10,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClubSelect = (club: { id: string; name: string }) => {
    onChange('homeClub', club.name);
    onChange('homeClubId', club.id);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleClearClub = () => {
    onChange('homeClub', '');
    onChange('homeClubId', null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Golf information</h2>
        <p className="text-xs text-muted-foreground">Your home club and handicap.</p>
      </div>

      <div className="space-y-4">
        {/* Home Club with Autocomplete - queries golf_clubs */}
        <div className="space-y-1.5">
          <Label htmlFor="homeClub" className="text-xs text-muted-foreground">
            Home Club
          </Label>
          <div ref={searchRef} className="relative">
            {homeClub ? (
              <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/30">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm">{homeClub}</span>
                <button
                  type="button"
                  onClick={handleClearClub}
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
                    id="homeClub"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search for your home club..."
                    className="pl-10 h-10"
                  />
                </div>

                {/* Search Results Dropdown - shows golf_clubs (collapsed multi-course clubs) */}
                {isSearchOpen && searchQuery.length >= 2 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-sq-sm shadow-lg max-h-64 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No clubs found
                      </div>
                    ) : (
                      <div className="py-1">
                        {searchResults.map((club) => (
                          <button
                            key={club.id}
                            type="button"
                            onClick={() => handleClubSelect(club)}
                            className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                          >
                            {club.country && (
                              <img
                                src={`https://flagcdn.com/w20/${getFlagCode(club.country)}.png`}
                                alt={club.country}
                                className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {club.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[club.sub_country, club.country].filter(Boolean).join(', ')}
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
          </div>
          <p className="text-[11px] text-muted-foreground">
            This helps us show you local courses and friends.
          </p>
        </div>

        {/* Handicap Index */}
        <div className="space-y-1.5">
          <Label htmlFor="handicap" className="text-xs text-muted-foreground">
            Handicap Index
          </Label>
          <Input
            id="handicap"
            type="number"
            step="0.1"
            min="-10"
            max="54"
            value={handicap}
            onChange={(e) => onChange('handicap', e.target.value)}
            placeholder="e.g., 12.4"
            className="h-10"
          />
          <p className="text-[11px] text-muted-foreground">
            Used for leaderboards and round stats – leave blank if you don't have one yet.
          </p>
        </div>
      </div>
    </div>
  );
};
