import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronLeft, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClubSearch } from '@/hooks/leaderboards';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface ClubSearchBarProps {
  selectedClubId: string | null;
  selectedClubName: string | null;
  userHomeClubId: string | null;
  userHomeClubName: string | null;
  onClubSelect: (clubId: string | null, clubName: string | null) => void;
}

export function ClubSearchBar({
  selectedClubId,
  selectedClubName,
  userHomeClubId,
  userHomeClubName,
  onClubSelect,
}: ClubSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useClubSearch({
    searchTerm: debouncedSearch,
    enabled: isOpen && debouncedSearch.length >= 2,
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

  const handleSelect = (clubId: string, clubName: string) => {
    onClubSelect(clubId, clubName);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleBackToMyClub = () => {
    if (userHomeClubId) {
      onClubSelect(userHomeClubId, userHomeClubName);
    } else {
      onClubSelect(null, null);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const isViewingOtherClub = selectedClubId && selectedClubId !== userHomeClubId;

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Back to my club button */}
      {isViewingOtherClub && userHomeClubId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToMyClub}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
        >
          <ChevronLeft className="w-3 h-3 mr-1" />
          Back to {userHomeClubName || 'My Club'}
        </Button>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="rounded-xl relative flex items-center gap-2.5 px-3.5 py-3" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)' }}>
          <Search className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a golf club..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="flex-1 text-[14px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="p-2.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground active:scale-[0.9] transition-transform"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {isOpen && debouncedSearch.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 rounded-xl max-h-60 overflow-y-auto shadow-lg" style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.10)' }}>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-1 p-2">
                {results.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleSelect(club.id, club.name)}
                    className={cn(
                      'w-full p-3 rounded-xl cursor-pointer transition-all duration-150 text-left active:scale-[0.98]',
                      club.id === selectedClubId ? 'ring-2 bg-[rgba(247,147,30,0.06)]' : ''
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted/50">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {club.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {[club.region, club.country].filter(Boolean).join(', ') || 'Location unknown'}
                        </div>
                      </div>

                      {club.member_count > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{club.member_count}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-muted/50">
                  <MapPin className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No clubs found
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current club indicator */}
      {selectedClubName && !isOpen && (
        <p className="text-xs text-center text-muted-foreground">
          Showing rankings for <span className="font-medium text-foreground">{selectedClubName}</span>
        </p>
      )}
    </div>
  );
}