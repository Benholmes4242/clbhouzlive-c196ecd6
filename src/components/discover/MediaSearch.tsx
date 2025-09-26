import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaSearch } from '@/hooks/useMediaSearch';

interface MediaSearchProps {
  className?: string;
  placeholder?: string;
  onSearchChange?: (query: string) => void;
}

const MediaSearch = ({ 
  className, 
  placeholder = "Search videos and photos...",
  onSearchChange
}: MediaSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    query,
    setQuery,
    debouncedQuery,
    loading,
    recentSearches,
    trendingQueries,
    executeRecentSearch,
    executeTrendingSearch,
    clearRecentSearches
  } = useMediaSearch();

  // Pass debounced query to parent for filtering
  useEffect(() => {
    onSearchChange?.(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRecentClick = (searchQuery: string) => {
    executeRecentSearch(searchQuery);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleTrendingClick = (searchQuery: string) => {
    executeTrendingSearch(searchQuery);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
    // Prevent event bubbling to avoid unwanted behaviors
    e.stopPropagation();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasContent = query.length > 0 || recentSearches.length > 0 || trendingQueries.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div 
        className={cn(
          "relative flex items-center rounded-full transition-all duration-200",
          "bg-gray-100/80 border border-gray-200/60",
          "h-12 px-4 gap-3",
          isFocused && "bg-white border-gray-300 ring-2 ring-brand-orange/50"
        )}
      >
        <Search className="h-5 w-5 text-gray-500 flex-shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-base",
            "text-gray-900 placeholder:text-gray-500",
            "placeholder:transition-colors duration-200",
            isFocused && "placeholder:text-gray-600"
          )}
        />

        {query && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 focus:bg-gray-200 
                     focus:outline-none transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}

        {loading && (
          <div className="flex-shrink-0 w-5 h-5">
            <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && hasContent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-[1500] max-h-80 overflow-y-auto search-dropdown">
          {query.length === 0 && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Recent searches</span>
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search) => (
                      <button
                        key={search.id}
                        onClick={() => handleRecentClick(search.query)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRecentClick(search.query);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-brand-orange/20"
                        tabIndex={0}
                      >
                        {search.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Queries */}
              {trendingQueries.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Trending</span>
                  </div>
                  <div className="space-y-1">
                    {trendingQueries.map((trending, index) => (
                      <button
                        key={index}
                        onClick={() => handleTrendingClick(trending)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleTrendingClick(trending);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-brand-orange/20"
                        tabIndex={0}
                      >
                        {trending}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaSearch;