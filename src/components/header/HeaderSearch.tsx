import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearch } from "@/hooks/useSearch";
import SearchResults from "@/components/search/SearchResults";
import { useAdaptiveTextColor } from "@/hooks/useAdaptiveTextColor";

const HeaderSearch = () => {
  const location = useLocation();
  const isDiscoverPage = location.pathname === '/discover';
  const isProfilePage = location.pathname.includes('/profile');
  
  const {
    query,
    setQuery,
    results,
    loading,
    recentSearches,
    popularClubs,
    saveRecentSearch,
    clearRecentSearches,
    executeRecentSearch
  } = useSearch();
  
  const [showResults, setShowResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use adaptive text color for profile page, fallback to existing logic for other pages
  const shouldUseDarkText = useAdaptiveTextColor(searchRef);
  
  // Determine text color based on page and adaptive detection
  const getTextColorClasses = () => {
    if (isProfilePage) {
      return shouldUseDarkText 
        ? 'text-black placeholder-black/50' 
        : 'text-white placeholder-white/70';
    }
    return isDiscoverPage 
      ? 'text-black placeholder-black/50' 
      : 'text-white placeholder-white/70';
  };
  
  const getIconColorClass = () => {
    if (isProfilePage) {
      return shouldUseDarkText ? 'text-black' : 'text-white';
    }
    return isDiscoverPage ? 'text-black' : 'text-white';
  };

  const handleResultClick = (result: any) => {
    if (query.trim()) {
      saveRecentSearch(query);
    }
    setQuery('');
    setShowResults(false);
    setShowMobileSearch(false);
    setIsFocused(false);
  };

  const handleMobileSearchToggle = () => {
    if (showMobileSearch) {
      // Closing mobile search - clear everything
      setShowMobileSearch(false);
      setQuery('');
      setShowResults(false);
      setIsFocused(false);
    } else {
      // Opening mobile search
      setShowMobileSearch(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowResults(true);
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicks on results - increased delay for mobile
    setTimeout(() => {
      setIsFocused(false);
      setShowResults(false);
    }, 300);
  };

  const handleClearInput = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    executeRecentSearch(searchQuery);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Don't close if clicking on search results
      const target = event.target as Element;
      if (target.closest('[data-search-result]')) {
        return;
      }
      
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        if (showMobileSearch) {
          setShowMobileSearch(false);
          setQuery('');
          setShowResults(false);
          setIsFocused(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileSearch]);

  // Keyboard handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showMobileSearch) {
          setShowMobileSearch(false);
          setQuery('');
          setShowResults(false);
          setIsFocused(false);
        } else if (showResults) {
          setShowResults(false);
          setIsFocused(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showMobileSearch, showResults]);

  return (
    <>
      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4" ref={searchRef}>
        <div className="relative w-full">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 ${getIconColorClass()}`} style={{ width: '20px', height: '20px' }} />
          <input
            type="text"
            placeholder="Search players, courses, or content..."
            className={`w-full pl-12 pr-10 py-0.5 pt-2 bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-full focus:outline-none focus:ring-2 focus:ring-muted-foreground/10 transition-all duration-200 text-lg ${getTextColorClasses()}`}
            style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {query && (
            <button
              onClick={handleClearInput}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors z-10 ${getIconColorClass()} hover:opacity-70`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {showResults && (
            <SearchResults
              results={results}
              onResultClick={handleResultClick}
              loading={loading}
              query={query}
              recentSearches={recentSearches}
              popularClubs={popularClubs}
              onRecentSearchClick={handleRecentSearchClick}
              onClearRecentSearches={clearRecentSearches}
            />
          )}
        </div>
      </div>

      {/* Mobile Search Icon */}
      <Button 
        variant="ghost" 
        size="icon" 
        className={`md:hidden mt-3 hover:bg-transparent active:bg-transparent ${getIconColorClass()}`} 
        onClick={handleMobileSearchToggle}
      >
        <Search style={{ width: '20px', height: '20px' }} />
      </Button>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div 
          className="md:hidden fixed inset-0 z-[9997]"
          onClick={handleMobileSearchToggle}
        />
      )}

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div 
          className="md:hidden absolute top-full left-0 right-0 px-4 py-4 z-[9998]" 
          ref={mobileSearchRef}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="relative w-full" style={{ pointerEvents: 'auto' }}>
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 ${getIconColorClass()}`} style={{ width: '20px', height: '20px' }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search players, courses, or content..."
              className={`w-full pl-12 pr-10 py-2 pt-3 bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-full focus:outline-none focus:ring-2 focus:ring-muted-foreground/10 transition-all duration-200 text-lg ${getTextColorClasses()}`} 
              style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={handleInputFocus}
              autoFocus
            />
            {query && (
              <button
                onClick={handleClearInput}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors z-10 ${getIconColorClass()} hover:opacity-70`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showResults && (
              <SearchResults
                results={results}
                onResultClick={handleResultClick}
                loading={loading}
                query={query}
                recentSearches={recentSearches}
                popularClubs={popularClubs}
                onRecentSearchClick={handleRecentSearchClick}
                onClearRecentSearches={clearRecentSearches}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderSearch;