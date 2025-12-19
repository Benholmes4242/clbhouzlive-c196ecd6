import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, MapPin, Building, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalEntitySearch, saveRecentSearch, clearRecentSearches, type PersonResult, type ClubResult, type BusinessResult } from '@/hooks/useGlobalEntitySearch';
import { searchAnalytics } from '@/utils/searchAnalytics';
import { createSearchRouter } from '@/utils/searchRouting';

interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'business';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
  verified?: boolean;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRouter = createSearchRouter(navigate);
  
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const debouncedQuery = useDebounce(query, 250);
  
  const {
    people,
    clubs,
    businesses,
    recent,
    trending,
    isLoading,
  } = useGlobalEntitySearch({
    query: debouncedQuery,
    enabled: isOpen
  });

  // Convert to unified results
  const results: SearchResult[] = [
    ...people.map(person => ({
      id: person.id,
      type: 'user' as const,
      title: person.display_name,
      subtitle: person.home_club_name || 'Golfer',
      image: person.avatar_url || undefined,
      username: person.username || undefined,
      verified: person.verified
    })),
    ...clubs.map(club => ({
      id: club.id,
      type: 'course' as const,
      title: club.name,
      subtitle: `${club.region ? `${club.region}, ` : ''}${club.country}${club.global_rank ? ` • #${club.global_rank}` : ''}`,
      image: club.logo_url || undefined
    })),
    ...businesses.map(business => {
      // Format subtitle as "City, Country" only - no category, no full address
      const formatCityCountry = () => {
        if (business.city || business.country) {
          return [business.city, business.country].filter(Boolean).join(', ');
        }
        if (business.location) {
          const parts = business.location.split(',').map(p => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
          }
          return parts[0] ?? '';
        }
        return '';
      };
      return {
        id: business.id,
        type: 'business' as const,
        title: business.name,
        subtitle: formatCityCountry() || 'Business Profile',
        image: business.logo_url || undefined,
        verified: business.verified
      };
    })
  ];

  const popularItems: SearchResult[] = trending.map(item => ({
    id: item.id || crypto.randomUUID(),
    type: item.type === 'clubs' ? 'course' as const : 'user' as const,
    title: item.label,
    subtitle: item.subtitle || (item.type === 'clubs' ? 'Popular course' : 'Trending'),
    image: item.image || undefined
  }));

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const handleResultSelect = useCallback((result: SearchResult, position?: number) => {
    if (query.trim()) {
      saveRecentSearch(query);
    }
    searchAnalytics.searchResultSelected(result.type, result.id, position || 0, query);
    searchRouter.navigateToResult(result);
    onClose();
  }, [query, searchRouter, onClose]);

  const handleRecentSearchClick = useCallback((searchQuery: string) => {
    searchAnalytics.searchRecentClicked(searchQuery, 0);
    setQuery(searchQuery);
  }, []);

  const handleClear = () => {
    if (query) {
      setQuery('');
    } else {
      onClose();
    }
  };

  // Keyboard navigation
  const allItems = query.trim() ? results : [...recent.map(r => ({ ...r, type: 'recent' as const })), ...popularItems];
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && allItems[activeIndex]) {
          const item = allItems[activeIndex];
          if ('query' in item) {
            handleRecentSearchClick(item.query);
          } else {
            handleResultSelect(item as SearchResult, activeIndex);
          }
        }
        break;
    }
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  if (!isOpen) return null;

  const hasResults = query.trim() && results.length > 0;
  const showEmpty = query.trim() && !isLoading && results.length === 0;
  const showIdle = !query.trim() && (recent.length > 0 || popularItems.length > 0);

  // Group results
  const peopleResults = results.filter(r => r.type === 'user');
  const courseResults = results.filter(r => r.type === 'course');
  const businessResults = results.filter(r => r.type === 'business');

  return (
    <div 
      className="fixed inset-0 z-[80] flex flex-col"
      style={{
        background: 'rgba(10, 10, 10, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Search bar at top */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-white/6">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center gap-3 h-12 px-4 rounded-full bg-white/8 border border-white/10">
            <Search className="h-5 w-5 text-white/50 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search players, courses..."
              className="flex-1 bg-transparent border-none outline-none text-white text-base placeholder:text-white/40"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              onClick={handleClear}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label={query ? "Clear" : "Close"}
            >
              <X className="h-5 w-5 text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-3 py-4">
          
          {/* Loading state */}
          {isLoading && query.trim() && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-sq-md animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 bg-white/10 rounded" />
                    <div className="w-24 h-3 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-white/20" />
              <p className="text-white/50 text-sm">No results found for "{query}"</p>
              <p className="text-white/30 text-xs mt-1">Try searching by name or course</p>
            </div>
          )}

          {/* Results */}
          {hasResults && !isLoading && (
            <div className="space-y-6">
              {/* People section */}
              {peopleResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <User className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">People</span>
                  </div>
                  <div className="space-y-0.5">
                    {peopleResults.map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === index}
                        onClick={() => handleResultSelect(item, index)}
                        query={query}
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Courses section */}
              {courseResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Clubs & Courses</span>
                  </div>
                  <div className="space-y-0.5">
                    {courseResults.map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === peopleResults.length + index}
                        onClick={() => handleResultSelect(item, peopleResults.length + index)}
                        query={query}
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Business Profiles section */}
              {businessResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Building className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Business Profiles</span>
                  </div>
                  <div className="space-y-0.5">
                    {businessResults.map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === peopleResults.length + courseResults.length + index}
                        onClick={() => handleResultSelect(item, peopleResults.length + courseResults.length + index)}
                        query={query}
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Idle state: Recent + Trending */}
          {showIdle && (
            <div className="space-y-6">
              {/* Recent searches */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3 px-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-white/40" />
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Recent</span>
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {recent.slice(0, 8).map((search, index) => (
                      <button
                        key={search.id}
                        onClick={() => handleRecentSearchClick(search.query)}
                        className="px-3 py-1.5 text-xs rounded-full bg-white/8 hover:bg-white/12 text-white/70 transition-colors"
                      >
                        {search.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              {popularItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-3">
                    <TrendingUp className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Popular</span>
                  </div>
                  <div className="space-y-0.5">
                    {popularItems.slice(0, 5).map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === recent.length + index}
                        onClick={() => handleResultSelect(item, recent.length + index)}
                        query=""
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop tap to close */}
      <button
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close search"
      />
    </div>
  );
};

// Result row component
interface ResultRowProps {
  item: SearchResult;
  isActive: boolean;
  onClick: () => void;
  query: string;
  getInitials: (name: string) => string;
}

const ResultRow: React.FC<ResultRowProps> = ({ item, isActive, onClick, query, getInitials }) => {
  // Highlight matching text
  const highlightText = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-primary/20 text-primary">{part}</mark> : part
    );
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-sq-md transition-colors text-left group",
        isActive ? "bg-white/10" : "hover:bg-white/5"
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-sq-md flex items-center justify-center flex-shrink-0 relative bg-white/8 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-white/60">{getInitials(item.title)}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {highlightText(item.title)}
        </div>
        <div className="text-xs text-white/50 truncate">{item.subtitle}</div>
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 flex-shrink-0 transition-colors" />
    </button>
  );
};

export default SearchOverlay;
