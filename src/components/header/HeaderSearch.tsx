
import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearch } from "@/hooks/useSearch";
import SearchResults from "@/components/search/SearchResults";

const HeaderSearch = () => {
  const { query, setQuery, results, loading } = useSearch();
  const [showResults, setShowResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const handleResultClick = () => {
    setQuery('');
    setShowResults(false);
  };

  const handleMobileResultClick = () => {
    setQuery('');
    setShowResults(false);
    setShowMobileSearch(false);
  };

  const handleMobileSearchToggle = () => {
    setShowMobileSearch(!showMobileSearch);
    if (showMobileSearch) {
      setQuery('');
      setShowResults(false);
    }
  };

  // Enhanced click outside handler for mobile and desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Handle desktop search
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      
      // Handle mobile search
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        if (showMobileSearch) {
          setShowMobileSearch(false);
          setQuery('');
          setShowResults(false);
        }
      }
    };

    // Add both mouse and touch event listeners for better mobile support
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileSearch]);

  // Close mobile search on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showMobileSearch) {
          setShowMobileSearch(false);
          setQuery('');
          setShowResults(false);
        } else if (showResults) {
          setShowResults(false);
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
      <div className="hidden md:flex items-center max-w-md w-full mx-8" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search players, courses, or content..."
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-full border border-border focus:outline-none focus:border-gray-300"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          {showResults && (
            <SearchResults
              results={results}
              onResultClick={handleResultClick}
              loading={loading}
              query={query}
            />
          )}
        </div>
      </div>

      {/* Mobile Search Icon */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden" 
        onClick={handleMobileSearchToggle}
      >
        {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </Button>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div 
          className="md:hidden pb-4 absolute top-full left-0 right-0 bg-background border-t border-border px-4 z-[9998]" 
          ref={mobileSearchRef}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="relative w-full" style={{ pointerEvents: 'auto' }}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search players, courses, or content..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-full border border-border focus:outline-none focus:border-gray-300"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              autoFocus
            />
            {showResults && (
              <SearchResults
                results={results}
                onResultClick={handleMobileResultClick}
                loading={loading}
                query={query}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderSearch;
