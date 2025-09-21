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
import { useFloating, offset, flip, size, Placement } from '@floating-ui/react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  // Create search router for consistent navigation
  const searchRouter = createSearchRouter(navigate);
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const debouncedQuery = useDebounce(query, 250); // Optimized 250ms debounce

  // Floating UI setup for better dropdown positioning
  const placement: Placement = "bottom-start";
  
  const floating = useFloating({
    placement,
    middleware: isMobile
      ? [
          // mobile: never flip upward, force downward
          offset(8),
          size({
            apply({ elements, rects, availableHeight }) {
              Object.assign(elements.floating.style, {
                width: `${rects.reference.width}px`,
                maxHeight: `min(${availableHeight}px, 60vh)`,
              });
            },
          }),
        ]
      : [
          // desktop: allow flip if truly needed
          offset(8),
          flip({ fallbackPlacements: ["bottom-start"] }),
          size({
            apply({ elements, rects, availableHeight }) {
              Object.assign(elements.floating.style, {
                width: `${rects.reference.width}px`,
                maxHeight: `min(${availableHeight}px, 70vh)`,
              });
            },
          }),
        ],
    open: isOpen,
  });
  
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

  const isGlassDark = variant === 'glass-dark';
  const isSolidLight = variant === 'solid-light';

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

  // Handle visual viewport changes for iOS keyboard
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !('visualViewport' in window)) return;
    
    const vv = (window as any).visualViewport as VisualViewport;
    const onResize = () => {
      if (isOpen) floating.update();
    };
    
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, [isOpen, floating]);

  // Lock body scroll on mobile when dropdown is open
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isMobile]);

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
    <div className={cn("relative w-full", className)} ref={floating.refs.setReference}>
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
            isGlassDark && [
              "text-white placeholder:text-white/50",
              isOpen && "placeholder:text-white/70"
            ],
            isSolidLight && [
              "text-gray-900 placeholder:text-gray-500",
              isOpen && "placeholder:text-gray-600"
            ]
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

      {/* Results Dropdown with Portal for Mobile */}
      {isMobile && showResults ? (
        createPortal(
          <div
            ref={floating.refs.setFloating}
            style={{
              position: "fixed",
              top: `${Math.max(
                floating.y ?? 0,
                ((window as any).visualViewport?.offsetTop ?? 0) + 
                parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h-mobile")) + 8
              )}px`,
              left: `${floating.x ?? 0}px`,
              zIndex: 300,
              transformOrigin: "top left",
              width: `${floating.middlewareData.size?.width ?? 280}px`,
              maxHeight: `${floating.middlewareData.size?.maxHeight ?? '60vh'}`,
            }}
            className="rounded-2xl backdrop-blur-md bg-black/70 text-white shadow-xl overflow-auto overscroll-contain max-h-[60vh]"
          >
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
              anchorRef={{ current: floating.refs.reference.current as HTMLElement }}
              highlightQuery={query}
            />
          </div>,
          document.body
        )
      ) : !isMobile ? (
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
          anchorRef={{ current: floating.refs.reference.current as HTMLElement }}
          highlightQuery={query}
        />
      ) : null}
    </div>
  );
};

export default SearchPill;