import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalEntitySearch, saveRecentSearch, clearRecentSearches, type PersonResult, type ClubResult, type PageResult } from '@/hooks/useGlobalEntitySearch';
import GlobalSearchDropdown from '@/components/search/GlobalSearchDropdown';
import type { HeaderVariant } from '@/contexts/GlobalHeaderContext';
import { searchAnalytics } from '@/utils/searchAnalytics';
import { createSearchRouter } from '@/utils/searchRouting';

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
  isClubhousePage?: boolean;
}

const SearchPill = ({ 
  className, 
  autoFocus = false, 
  onClose,
  placeholder = "Search players, courses...",
  variant = 'glass-dark',
  onSelect,
  isClubhousePage = false
}: SearchPillProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Create search router for consistent navigation
  const searchRouter = createSearchRouter(navigate);
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const debouncedQuery = useDebounce(query, 250); // Optimized 250ms debounce
  
  // Use the new global entity search hook
  const {
    people,
    clubs,
    pages,
    recent,
    trending,
    isLoading,
    error
  } = useGlobalEntitySearch({
    query: debouncedQuery,
    enabled: true
  });

  // Color scheme based on page
  const useWhiteScheme = isClubhousePage;

  // Convert hook results to SearchResult format for compatibility
  const results: SearchResult[] = [
    ...people.map(person => ({
      id: person.id,
      type: 'user' as const,
      title: person.display_name,
      subtitle: person.home_club_name || 'No home club',
      image: person.avatar_url || undefined,
      username: person.username || undefined
    })),
    ...clubs.map(club => ({
      id: club.id,
      type: 'course' as const,
      title: club.name,
      subtitle: `${club.region ? `${club.region}, ` : ''}${club.country}${club.global_rank ? ` • #${club.global_rank}` : ''}`,
      image: club.logo_url || undefined
    }))
  ];

  // Convert trending to SearchResult format
  const popularItems: SearchResult[] = trending.map(item => ({
    id: item.id || crypto.randomUUID(),
    type: item.type === 'clubs' ? 'course' as const : 'user' as const,
    title: item.label,
    subtitle: item.type === 'clubs' ? 'Popular course' : 'Trending'
  }));

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle route navigation
  const handleResultSelect = useCallback((result: SearchResult, position?: number) => {
    // Save to recent searches if there's a query
    if (query.trim()) {
      saveRecentSearch(query);
    }

    // Track analytics
    searchAnalytics.searchResultSelected(result.type, result.id, position || 0, query);

    // Custom onSelect handler takes precedence
    if (onSelect) {
      onSelect(result);
    } else {
      // Use search router for consistent navigation
      searchRouter.navigateToResult(result);
    }

    // Reset search state
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    
    if (onClose) {
      onClose();
    }
  }, [query, onSelect, searchRouter, onClose]);

  // Handle recent search execution
  const handleRecentSearchClick = useCallback((searchQuery: string, position?: number) => {
    // Track analytics
    searchAnalytics.searchRecentClicked(searchQuery, position || 0);
    
    setQuery(searchQuery);
    setIsOpen(false);
  }, []);

  // Show dropdown results or recent/trending
  const showResults = isOpen && (query.length >= 1 || (!query && (recent.length > 0 || popularItems.length > 0)));
  const displayItems: DisplayItem[] = query.length >= 1 ? results : [...recent.map(r => ({ id: r.id, type: 'recent' as const, title: r.query, subtitle: 'Recent search' })), ...popularItems.slice(0, 5)];

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
            handleRecentSearchClick(item.title, activeIndex);
          } else {
            handleResultSelect(item as SearchResult, activeIndex);
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
    // Track search opened analytics
    searchAnalytics.searchOpened('header');
  };

  const handleInputBlur = () => {
    // Delay to allow clicks on dropdown items - longer on mobile for better UX
    const delay = 300; // Increased for mobile taps
    setTimeout(() => {
      setIsOpen(false);
      setActiveIndex(-1);
    }, delay);
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
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <div 
        className={cn(
          "relative flex items-center rounded-full",
          "h-11 md:h-12 px-4 md:px-6 gap-3",
          "bg-transparent border transition-all duration-200",
          useWhiteScheme ? "border-white" : "border-black/20",
          isOpen && useWhiteScheme && "border-white",
          isOpen && !useWhiteScheme && "border-black/40"
        )}
      >
        {/* Search Icon */}
        <Search className={cn(
          "h-4 w-4 md:h-5 md:w-5 flex-shrink-0",
          useWhiteScheme ? "text-white !text-white" : "text-black/70"
        )} />

        {/* Input with enhanced accessibility */}
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
            // Enhanced focus styles for accessibility
            "focus:ring-0 focus:outline-none",
            useWhiteScheme ? "text-white placeholder:text-white !text-white !placeholder:text-white" : "text-black placeholder:text-black/50",
            isOpen && useWhiteScheme && "placeholder:text-white",
            isOpen && !useWhiteScheme && "placeholder:text-black/70"
          )}
          aria-label={placeholder}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck="false"
          role="combobox"
        />

        {/* Clear/Close button */}
        {(query || onClose) && (
          <button
            onClick={handleClear}
            className={cn(
              "flex-shrink-0 p-1 rounded-full transition-colors focus:outline-none",
              useWhiteScheme ? "hover:bg-white/10 focus:bg-white/10" : "hover:bg-black/10 focus:bg-black/10"
            )}
            aria-label="Clear search"
          >
            <X className={cn(
              "h-3 w-3 md:h-4 md:w-4",
              useWhiteScheme ? "text-white" : "text-black/70"
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
        isLoading={isLoading}
        recentSearches={recent}
        popularItems={popularItems}
        onResultSelect={handleResultSelect}
        onRecentSearchClick={handleRecentSearchClick}
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