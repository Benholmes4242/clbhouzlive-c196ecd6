import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Search } from 'lucide-react';

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  onClose?: () => void;
}

// Mock data - replace with real API calls
const TRENDING_SEARCHES = [
  'Golf tips',
  'Putting technique',
  'Drive distance',
  'Short game',
  'Course management',
];

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSelect,
  onClose,
}) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recent_video_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (query.trim()) {
      // Simulate search API call - replace with real API
      // Filter trending searches based on query
      const filtered = TRENDING_SEARCHES.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const handleSelect = (suggestion: string) => {
    // Save to recent searches
    const updated = [suggestion, ...recentSearches.filter(s => s !== suggestion)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_video_searches', JSON.stringify(updated));
    onSelect(suggestion);
  };

  const showTrending = !query.trim() && TRENDING_SEARCHES.length > 0;
  const showRecent = !query.trim() && recentSearches.length > 0;
  const showResults = query.trim() && searchResults.length > 0;

  if (!showTrending && !showRecent && !showResults) {
    return null;
  }

  return (
    <motion.div
      ref={dropdownRef}
      id="search-suggestions"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl ring-1 ring-black/5 bg-white overflow-hidden max-h-[50vh] overflow-y-auto z-50"
      role="listbox"
    >
      {/* Recent Searches */}
      {showRecent && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Recent
          </div>
          {recentSearches.map((search, index) => (
            <button
              key={`recent-${index}`}
              onClick={() => handleSelect(search)}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 transition-colors text-left"
              role="option"
            >
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{search}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Suggestions
          </div>
          {searchResults.map((result, index) => (
            <button
              key={`result-${index}`}
              onClick={() => handleSelect(result)}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 transition-colors text-left"
              role="option"
            >
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{result}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trending */}
      {showTrending && (
        <div className="p-2 border-t border-gray-100">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Trending
          </div>
          {TRENDING_SEARCHES.map((trend, index) => (
            <button
              key={`trend-${index}`}
              onClick={() => handleSelect(trend)}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 transition-colors text-left"
              role="option"
            >
              <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{trend}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SearchSuggestions;
