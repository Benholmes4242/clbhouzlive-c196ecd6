import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronLeft, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    <div className="px-4 py-2 space-y-2" ref={containerRef}>
      {/* Back to my club button */}
      {isViewingOtherClub && userHomeClubId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToMyClub}
          className="h-8 px-2 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50"
        >
          <ChevronLeft className="w-3 h-3 mr-1" />
          Back to {userHomeClubName || 'My Club'}
        </Button>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search any golf club..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 h-10 bg-muted/30 border-muted"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown results */}
        {isOpen && debouncedSearch.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-border max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results && results.length > 0 ? (
              results.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleSelect(club.id, club.name)}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                    'flex items-center justify-between gap-2',
                    club.id === selectedClubId && 'bg-teal-50 dark:bg-teal-900/20'
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{club.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[club.region, club.country].filter(Boolean).join(', ') || 'Location unknown'}
                    </div>
                  </div>
                  {club.member_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Users className="w-3 h-3" />
                      {club.member_count}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No clubs found for "{debouncedSearch}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current club indicator */}
      {selectedClubName && !isOpen && (
        <div className="text-xs text-muted-foreground text-center">
          Showing rankings for <span className="font-medium text-foreground">{selectedClubName}</span>
        </div>
      )}
    </div>
  );
}
