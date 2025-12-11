import React, { useState, useRef, useEffect } from 'react';
import { MapPin, TrendingDown, Search, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCourseSearch } from '@/hooks/useCourseSearch';
import { getFlagCode } from '@/utils/countryFlags';
import { cn } from '@/lib/utils';

interface GolfInfoSectionProps {
  homeClub: string;
  handicap: string;
  onChange: (field: string, value: string) => void;
}

export const GolfInfoSection: React.FC<GolfInfoSectionProps> = ({
  homeClub,
  handicap,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { data: searchResults, loading } = useCourseSearch(searchQuery, {
    debounceMs: 250,
    limit: 8,
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

  const handleCourseSelect = (courseName: string) => {
    onChange('homeClub', courseName);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleClearClub = () => {
    onChange('homeClub', '');
    setSearchQuery('');
  };

  return (
    <Card className="overflow-hidden bg-white shadow-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Golf Information</h3>
            <p className="text-sm text-muted-foreground">
              Your home club and handicap
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Home Club with Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="homeClub">Home Club</Label>
            <div ref={searchRef} className="relative">
              {homeClub ? (
                <div className="flex items-center gap-2 p-3 border border-border rounded-sq-sm bg-muted/30">
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
                      className="pl-10 h-11"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {isSearchOpen && searchQuery.length >= 2 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-sq-sm shadow-lg max-h-64 overflow-y-auto">
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
                          {searchResults.map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => handleCourseSelect(course.name)}
                              className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                            >
                              {course.country && (
                                <img
                                  src={`https://flagcdn.com/w20/${getFlagCode(course.country)}.png`}
                                  alt={course.country}
                                  className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {course.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {[course.sub_country, course.country].filter(Boolean).join(', ')}
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
          </div>

          {/* Handicap Index */}
          <div className="space-y-2">
            <Label htmlFor="handicap" className="flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5" />
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
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Your official handicap index (WHS)
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
