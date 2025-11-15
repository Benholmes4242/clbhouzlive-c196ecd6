import React from 'react';
import { User, MapPin, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Squircle } from '@/components/ui/squircle';
import { Button } from '@/components/ui/button';
import TrendingTags from './TrendingTags';
import RecentSearches from './RecentSearches';
import Suggestions from './Suggestions';

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
        <div className="p-6 text-center text-gray-500">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
          Searching...
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
        <div className="p-6 text-center text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-sm">No users or clubs found for "{query}"</p>
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
            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-lg border-b border-gray-100 last:border-b-0 transition-colors"
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
                <Squircle width={48} height={48}>
                  {result.image ? (
                    <img src={result.image} alt={result.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '18px', fontWeight: 600 }}>
                      {result.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Squircle>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MapPin className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{result.title}</p>
              <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center px-2 py-1 bg-gray-50 rounded-full">
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
    </div>
  );
};

export default SearchResults;