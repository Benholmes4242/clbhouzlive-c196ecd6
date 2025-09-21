import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useSearch';
import GlobalSearchDropdown from '@/components/search/GlobalSearchDropdown';
import type { HeaderVariant } from '@/contexts/GlobalHeaderContext';

interface SearchResult {
  id: string;
  type: 'user' | 'course';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
}

interface RecentSearchItem {
  id: string;
  type: 'recent';
  title: string;
  subtitle: string;
  image?: never;
}

type DisplayItem = SearchResult | RecentSearchItem;

interface SearchPillProps {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
  placeholder?: string;
  variant?: HeaderVariant;
  onSelect?: (result: SearchResult) => void;
}

const SearchPill = ({ 
  className, 
  autoFocus = false, 
  onClose,
  placeholder = "Search players, courses...",
  variant = 'glass-dark',
  onSelect
}: SearchPillProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const debouncedQuery = useDebounce(query, 300);
  
  const {
    results,
    loading,
    recentSearches,
    popularClubs,
    saveRecentSearch,
    clearRecentSearches,
    executeRecentSearch
  } = useSearch();

  const isGlassDark = variant === 'glass-dark';
  const isSolidLight = variant === 'solid-light';

  // Set search query for useSearch hook
  const { setQuery: setSearchQuery } = useSearch();
  
  useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery, setSearchQuery]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle route navigation
  const handleResultSelect = useCallback((result: SearchResult) => {
    if (query.trim()) {
      saveRecentSearch(query);
    }

    // Custom onSelect handler
    if (onSelect) {
      onSelect(result);
    } else {
      // Default navigation
      if (result.type === 'user') {
        navigate(`/profile/${result.username || result.id}`);
      } else if (result.type === 'course') {
        navigate(`/course/${result.id}`);
      }
    }

    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    
    if (onClose) {
      onClose();
    }
  }, [query, saveRecentSearch, onSelect, navigate, onClose]);

  // Show dropdown results or recent/trending
  const showResults = isOpen && (query.length >= 1 || (!query && (recentSearches.length > 0 || popularClubs.length > 0)));
  const displayItems: DisplayItem[] = query.length >= 1 ? results : [...recentSearches.map(r => ({ id: r.id, type: 'recent' as const, title: r.query, subtitle: 'Recent search' })), ...popularClubs.slice(0, 5)];

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        if (onClose) onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, displayItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && displayItems[activeIndex]) {
          const item = displayItems[activeIndex];
          if (item.type === 'recent') {
            executeRecentSearch(item.title);
          } else {
            handleResultSelect(item as SearchResult);
          }
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay to allow clicks on dropdown items
    setTimeout(() => {
      setIsOpen(false);
      setActiveIndex(-1);
    }, 200);
  };

  const handleClear = () => {
    setQuery('');
    setActiveIndex(-1);
    if (onClose) {
      onClose();
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div 
        className={cn(
          "relative flex items-center rounded-full transition-all duration-200",
          "h-11 md:h-12 px-4 md:px-6 gap-3",
           // Variant-specific styling
           isGlassDark && [
             "bg-white/10 backdrop-blur-md border border-white/20",
             isOpen && "bg-white/15 border-white/30"
           ],
           isSolidLight && [
             "bg-gray-100/80 border border-gray-200/60",
             isOpen && "bg-white border-gray-300"
           ]
        )}
      >
        {/* Search Icon */}
        <Search className={cn(
          "h-4 w-4 md:h-5 md:w-5 flex-shrink-0",
          isGlassDark && "text-white/70",
          isSolidLight && "text-gray-500"
        )} />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-sm md:text-base",
            "placeholder:transition-colors duration-200",
            isGlassDark && [
              "text-white placeholder:text-white/50",
              isOpen && "placeholder:text-white/70"
            ],
            isSolidLight && [
              "text-gray-900 placeholder:text-gray-500",
              isOpen && "placeholder:text-gray-600"
            ]
          )}
        />

        {/* Clear/Close button */}
        {(query || onClose) && (
          <button
            onClick={handleClear}
            className={cn(
              "flex-shrink-0 p-1 rounded-full transition-colors focus:outline-none",
              isGlassDark && "hover:bg-white/10 focus:bg-white/10",
              isSolidLight && "hover:bg-gray-200 focus:bg-gray-200"
            )}
            aria-label="Clear search"
          >
            <X className={cn(
              "h-3 w-3 md:h-4 md:w-4",
              isGlassDark && "text-white/70",
              isSolidLight && "text-gray-500"
            )} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <GlobalSearchDropdown
        isOpen={showResults}
        onClose={() => {
          setIsOpen(false);
          setActiveIndex(-1);
        }}
        query={query}
        results={results}
        loading={loading}
        recentSearches={recentSearches}
        popularItems={popularClubs}
        onResultSelect={handleResultSelect}
        onRecentSearchClick={(searchQuery) => {
          executeRecentSearch(searchQuery);
          setIsOpen(false);
        }}
        onClearRecentSearches={clearRecentSearches}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        anchorRef={{ current: dropdownRef.current }}
        highlightQuery={query}
      />
    </div>
  );
};

export default SearchPill;