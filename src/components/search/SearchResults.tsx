import React from 'react';
import { User, MapPin, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  type: 'user' | 'course';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  loading: boolean;
  query: string;
  recentSearches: RecentSearch[];
  popularClubs: SearchResult[];
  onRecentSearchClick: (query: string) => void;
  onClearRecentSearches: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
  loading,
  query,
  recentSearches,
  popularClubs,
  onRecentSearchClick,
  onClearRecentSearches
}) => {
  const navigate = useNavigate();

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user' && result.username) {
      navigate(`/profile/${result.username}`);
    } else if (result.type === 'course') {
      navigate(`/courses/${result.id}`);
    }
    onResultClick(result);
  };

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-2 shadow-lg z-[9999] pointer-events-auto">
        <div className="p-4 text-center text-muted-foreground">
          Searching...
        </div>
      </div>
    );
  }

  // Show default state when no query
  if (!query.trim()) {
    return (
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-2 shadow-lg z-[9999] max-h-96 overflow-y-auto pointer-events-auto">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Recent Searches</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearRecentSearches}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            {recentSearches.map((search) => (
              <div
                key={search.id}
            className="flex items-center p-2 hover:bg-muted cursor-pointer rounded-md"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRecentSearchClick(search.query);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
              >
                <Clock className="h-4 w-4 text-muted-foreground mr-3" />
                <span className="text-sm text-foreground">{search.query}</span>
              </div>
            ))}
          </div>
        )}

        {/* Popular Clubs */}
        {popularClubs.length > 0 && (
          <div className="p-3">
            <h3 className="text-sm font-medium text-foreground mb-2">Popular Clubs</h3>
            {popularClubs.map((club) => (
              <div
                key={club.id}
              className="flex items-center p-2 hover:bg-muted cursor-pointer rounded-md"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleResultClick(club);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              >
                <div className="mr-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {club.image ? (
                      <img
                        src={club.image}
                        alt={club.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{club.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{club.subtitle}</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  Club
                </div>
              </div>
            ))}
          </div>
        )}

        {recentSearches.length === 0 && popularClubs.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            Start typing to search for players and clubs
          </div>
        )}
      </div>
    );
  }

  // Show search results
  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-2 shadow-lg z-[9999] pointer-events-auto">
        <div className="p-4 text-center text-muted-foreground">
          No users or clubs found for "{query}"
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-2 shadow-lg z-[9999] max-h-96 overflow-y-auto pointer-events-auto">
      {results.map((result) => (
        <div
          key={`${result.type}-${result.id}`}
          className="flex items-center p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResultClick(result);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="mr-3">
            {result.type === 'user' ? (
              <Avatar className="w-10 h-10">
                <AvatarImage src={result.image} alt={result.title} />
                <AvatarFallback>
                  <User className="w-5 h-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                {result.image ? (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">{result.title}</p>
            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            {result.type === 'user' ? (
              <>
                <User className="w-3 h-3 mr-1" />
                User
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3 mr-1" />
                Club
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;