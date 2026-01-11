import React from 'react';
import { User, MapPin, Clock, Trash2, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TrendingTags from './TrendingTags';
import RecentSearches from './RecentSearches';
import Suggestions from './Suggestions';

interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'business';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
  verified?: boolean;
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
    } else if (result.type === 'business') {
      navigate(`/business/${result.id}`);
    }
    onResultClick(result);
  };

  const handleTagClick = (tag: string) => {
    onRecentSearchClick(tag);
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'creator') {
      navigate(`/profile/${suggestion.handle?.replace('@', '') || suggestion.id}`);
    } else if (suggestion.type === 'course') {
      navigate(`/courses/${suggestion.id}`);
    }
  };

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-xl z-[9999] pointer-events-auto animate-fade-in">
        <div className="p-6 flex flex-col items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
          <span className="text-sm">Searching...</span>
        </div>
      </div>
    );
  }

  // Show enhanced default state when no query
  if (!query.trim()) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-xl z-[9999] max-h-[80vh] overflow-y-auto pointer-events-auto animate-fade-in">
        <div className="p-4">
          {/* Trending Tags */}
          <TrendingTags onTagClick={handleTagClick} />
          
          {/* Recent Searches */}
          <RecentSearches
            recentSearches={recentSearches}
            onRecentSearchClick={onRecentSearchClick}
            onClearRecentSearches={onClearRecentSearches}
          />
          
          {/* Suggestions */}
          <Suggestions onCreatorClick={handleSuggestionClick} />
          
          {/* Default message when no sections have content */}
          {recentSearches.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">🔍</div>
              <p className="text-sm">Start typing to search for players, courses, or content</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show search results
  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-xl z-[9999] pointer-events-auto animate-fade-in">
        <div className="py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-sm text-gray-500">We couldn't find any matches for "{query}"</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-xl z-[9999] max-h-[80vh] overflow-y-auto pointer-events-auto animate-fade-in">
      <div className="p-2">
        {results.map((result) => (
          <div
            key={`${result.type}-${result.id}`}
            data-search-result
            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-xl border border-transparent hover:border-gray-100 transition-all group"
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
            {/* Avatar/Image with enhanced styling */}
            <div className="mr-3 relative">
              {result.type === 'user' ? (
                <SquircleAvatar
                  src={result.image}
                  alt={result.title}
                  size={48}
                  fallback={result.title.charAt(0).toUpperCase()}
                  hideRing
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 group-hover:border-gray-300 transition-colors">
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <MapPin className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              )}
              
              {/* Business indicator badge */}
              {result.type === 'business' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Building className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            
            {/* Content with better hierarchy */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base text-gray-900 truncate group-hover:text-primary transition-colors">{result.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {result.type === 'course' && (
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                )}
                <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
              </div>
            </div>
            
            {/* Type badge with enhanced styling */}
            <div className={cn(
              "text-xs font-medium flex items-center px-2.5 py-1 rounded-full transition-colors",
              result.type === 'user' 
                ? "bg-blue-50 text-blue-700"
                : result.type === 'business'
                ? "bg-purple-50 text-purple-700"
                : "bg-green-50 text-green-700"
            )}>
              {result.type === 'user' ? (
                <>
                  <User className="w-3 h-3 mr-1" />
                  Golfer
                </>
              ) : result.type === 'business' ? (
                <>
                  <Building className="w-3 h-3 mr-1" />
                  Business
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 mr-1" />
                  Course
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;