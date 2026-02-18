import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, MapPin, Building, Clock, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
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
  useLightTheme?: boolean;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, useLightTheme = false }) => {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] flex flex-col min-h-0 h-full"
      style={{
        background: useLightTheme ? 'hsl(var(--background) / 0.98)' : 'rgba(10, 10, 10, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
      }}
    >
      {/* Search bar at top - Enhanced */}
      <div className={cn(
        "flex-shrink-0 px-4 pt-4 pb-3 border-b",
        useLightTheme ? "border-border/60" : "border-white/6"
      )}>
        <div className="max-w-2xl mx-auto">
          <div className={cn(
            "relative flex items-center gap-3 h-12 px-4 rounded-xl border transition-all",
            useLightTheme 
              ? "bg-muted/50 border-border focus-within:border-border/80 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/30" 
              : "bg-white/8 border-white/10 focus-within:border-white/20 focus-within:ring-2 focus-within:ring-white/10"
          )}>
            <Search className={cn(
              "h-5 w-5 flex-shrink-0",
              useLightTheme ? "text-muted-foreground/60" : "text-white/50"
            )} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search players, courses, businesses..."
              className={cn(
                "flex-1 bg-transparent border-none outline-none text-base",
                useLightTheme 
                  ? "text-foreground placeholder:text-muted-foreground/60" 
                  : "text-white placeholder:text-white/40"
              )}
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className={cn(
                  "flex-shrink-0 p-2.5 rounded-full transition-all active:scale-[0.9]",
                  useLightTheme ? "hover:bg-muted bg-muted/50" : "hover:bg-white/15 bg-white/10"
                )}
                aria-label="Clear search"
              >
                <X className={cn(
                  "h-3.5 w-3.5",
                  useLightTheme ? "text-muted-foreground" : "text-white/60"
                )} />
              </button>
            )}
            <button
              onClick={onClose}
              className={cn(
                "flex-shrink-0 px-3 py-3 text-sm font-medium rounded-full transition-all active:scale-[0.97]",
                useLightTheme 
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                  : "text-white/50 hover:text-white/70 hover:bg-white/10"
              )}
            >
              Cancel
            </button>
          </div>
          {/* Search hints */}
          {!query && (
            <p className={cn(
              "text-xs mt-2 px-1",
              useLightTheme ? "text-muted-foreground/60" : "text-white/30"
            )}>
              Try "Pebble Beach", "@username", or "Augusta"
            </p>
          )}
        </div>
      </div>

      {/* Results area - iOS scroll fix: min-h-0 + momentum */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-2xl mx-auto px-3 py-4 pb-safe">
          
          {/* Loading state */}
          {isLoading && query.trim() && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-sq-md animate-pulse">
                  <div className={cn(
                    "w-10 h-10 rounded-full",
                    useLightTheme ? "bg-muted" : "bg-white/10"
                  )} />
                  <div className="flex-1 space-y-2">
                    <div className={cn(
                      "w-32 h-4 rounded",
                      useLightTheme ? "bg-muted" : "bg-white/10"
                    )} />
                    <div className={cn(
                      "w-24 h-3 rounded",
                      useLightTheme ? "bg-muted/50" : "bg-white/5"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state - Enhanced */}
          {showEmpty && (
            <div className="py-16 text-center px-6">
              <div className={cn(
                "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
                useLightTheme ? "bg-muted" : "bg-white/5"
              )}>
                <Search className={cn(
                  "h-10 w-10",
                  useLightTheme ? "text-muted-foreground/30" : "text-white/20"
                )} />
              </div>
              <h3 className={cn(
                "text-lg font-semibold mb-2",
                useLightTheme ? "text-foreground" : "text-white"
              )}>No results found</h3>
              <p className={cn(
                "text-sm max-w-sm mx-auto",
                useLightTheme ? "text-muted-foreground" : "text-white/50"
              )}>
                We couldn't find any matches for "{query}". Try searching for a different course, player, or business.
              </p>
              {/* Search suggestions */}
              <div className="mt-6 space-y-2">
                <p className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  useLightTheme ? "text-muted-foreground" : "text-white/40"
                )}>Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Pebble Beach', 'St Andrews', 'Augusta'].map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        useLightTheme 
                          ? "bg-muted hover:bg-muted/80 text-foreground"
                          : "bg-white/10 hover:bg-white/15 text-white/70"
                      )}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {hasResults && !isLoading && (
            <div className="space-y-6">
              {/* People section - Enhanced */}
              {peopleResults.length > 0 && (
                <div>
                  <div className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 mb-1 sticky top-0 z-[2] backdrop-blur-md rounded-lg",
                    useLightTheme 
                      ? "bg-background/95" 
                      : "bg-[rgba(10,10,10,0.95)]"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      useLightTheme ? "bg-blue-100" : "bg-blue-500/20"
                    )}>
                      <User className={cn(
                        "h-3.5 w-3.5",
                        useLightTheme ? "text-blue-600" : "text-blue-400"
                      )} />
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      useLightTheme ? "text-foreground" : "text-white/70"
                    )}>People</span>
                  </div>
                  <div className="space-y-1">
                    {peopleResults.map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === index}
                        onClick={() => handleResultSelect(item, index)}
                        query={query}
                        getInitials={getInitials}
                        useLightTheme={useLightTheme}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Courses section - Enhanced */}
              {courseResults.length > 0 && (
                <div>
                  <div className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 mb-1 sticky top-0 z-[2] backdrop-blur-md rounded-lg",
                    useLightTheme 
                      ? "bg-background/95" 
                      : "bg-[rgba(10,10,10,0.95)]"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      useLightTheme ? "bg-orange-100" : "bg-primary/20"
                    )}>
                      <MapPin className={cn(
                        "h-3.5 w-3.5",
                        useLightTheme ? "text-orange-600" : "text-primary"
                      )} />
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      useLightTheme ? "text-foreground" : "text-white/70"
                    )}>Clubs & Courses</span>
                  </div>
                  <div className="space-y-1">
                    {courseResults.map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === peopleResults.length + index}
                        onClick={() => handleResultSelect(item, peopleResults.length + index)}
                        query={query}
                        getInitials={getInitials}
                        useLightTheme={useLightTheme}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Business Profiles section - Enhanced */}
              {businessResults.length > 0 && (
                <div>
                  <div className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 mb-1 sticky top-0 z-[2] backdrop-blur-md rounded-lg",
                    useLightTheme 
                      ? "bg-background/95" 
                      : "bg-[rgba(10,10,10,0.95)]"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      useLightTheme ? "bg-purple-100" : "bg-purple-500/20"
                    )}>
                      <Building className={cn(
                        "h-3.5 w-3.5",
                        useLightTheme ? "text-purple-600" : "text-purple-400"
                      )} />
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      useLightTheme ? "text-foreground" : "text-white/70"
                    )}>Business Profiles</span>
                  </div>
                  <div className="space-y-1">
                    {businessResults.map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === peopleResults.length + courseResults.length + index}
                        onClick={() => handleResultSelect(item, peopleResults.length + courseResults.length + index)}
                        query={query}
                        getInitials={getInitials}
                        useLightTheme={useLightTheme}
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
              {/* Recent searches - Enhanced */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center",
                        useLightTheme ? "bg-muted" : "bg-white/10"
                      )}>
                        <Clock className={cn(
                          "h-3.5 w-3.5",
                          useLightTheme ? "text-muted-foreground" : "text-white/50"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        useLightTheme ? "text-foreground" : "text-white/70"
                      )}>Recent</span>
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className={cn(
                        "py-3 px-2 text-xs font-medium transition-all active:scale-[0.97]",
                        "text-primary hover:text-primary/80"
                      )}
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-3">
                    {recent.slice(0, 8).map((search, index) => (
                      <button
                        key={search.id}
                        onClick={() => handleRecentSearchClick(search.query)}
                        className={cn(
                          "max-w-[200px] truncate px-4 py-2.5 text-sm font-medium rounded-full transition-all active:scale-[0.97]",
                          useLightTheme 
                            ? "bg-muted hover:bg-muted/80 text-foreground hover:shadow-sm" 
                            : "bg-white/10 hover:bg-white/15 text-white/80"
                        )}
                      >
                        {search.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Picks - Daily rotating content */}
              {popularItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br",
                        useLightTheme ? "from-orange-500 to-amber-500" : "from-primary to-amber-500"
                      )}>
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        useLightTheme ? "text-foreground" : "text-white/70"
                      )}>Today's Picks</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-[10px]",
                      useLightTheme ? "text-muted-foreground/60" : "text-white/30"
                    )}>
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Updates daily</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {popularItems.slice(0, 5).map((item, index) => (
                      <ResultRow 
                        key={item.id} 
                        item={item} 
                        isActive={activeIndex === recent.length + index}
                        onClick={() => handleResultSelect(item, recent.length + index)}
                        query=""
                        getInitials={getInitials}
                        useLightTheme={useLightTheme}
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
    </motion.div>
  );
};

// Result row component
interface ResultRowProps {
  item: SearchResult;
  isActive: boolean;
  onClick: () => void;
  query: string;
  getInitials: (name: string) => string;
  useLightTheme?: boolean;
}

const ResultRow: React.FC<ResultRowProps> = ({ item, isActive, onClick, query, getInitials, useLightTheme = false }) => {
  // Highlight matching text with subtle background
  const highlightText = (text: string) => {
    if (!query.trim() || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span 
          key={i} 
          className="bg-amber-500/[0.18] rounded-sm"
        >
          {part}
        </span>
      ) : part
    );
  };

  // Get type-specific styling
  const getTypeStyles = () => {
    switch (item.type) {
      case 'user':
        return {
          gradient: useLightTheme ? 'from-blue-500 to-blue-600' : 'from-blue-400 to-blue-600',
          badge: useLightTheme ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/20 text-blue-300',
          label: 'Golfer'
        };
      case 'business':
        return {
          gradient: useLightTheme ? 'from-purple-500 to-purple-600' : 'from-purple-400 to-purple-600',
          badge: useLightTheme ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/20 text-purple-300',
          label: 'Business',
          hoverBg: useLightTheme ? 'hover:bg-purple-50/50' : 'hover:bg-purple-500/5'
        };
      case 'course':
        return {
          gradient: useLightTheme ? 'from-green-500 to-green-600' : 'from-green-400 to-green-600',
          badge: useLightTheme ? 'bg-green-50 text-green-700' : 'bg-green-500/20 text-green-300',
          label: 'Course'
        };
      default:
        return {
          gradient: useLightTheme ? 'from-muted-foreground/40 to-muted-foreground/60' : 'from-white/40 to-white/60',
          badge: useLightTheme ? 'bg-muted text-muted-foreground' : 'bg-white/10 text-white/60',
          label: ''
        };
    }
  };

  const typeStyles = getTypeStyles();

  // Extract ranking from subtitle if present (e.g., "California, USA • #7")
  const extractRanking = (subtitle: string) => {
    const match = subtitle.match(/#(\d+)/);
    return match ? match[1] : null;
  };

  const ranking = item.type === 'course' ? extractRanking(item.subtitle) : null;
  const subtitleWithoutRanking = ranking ? item.subtitle.replace(/\s*•\s*#\d+/, '') : item.subtitle;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group active:scale-[0.99] bg-transparent active:bg-white/5",
        useLightTheme 
          ? isActive ? "bg-muted ring-1 ring-border" : "hover:bg-muted/50 active:bg-muted"
          : isActive ? "bg-white/10 ring-1 ring-white/10" : ""
      )}
    >
      {/* Avatar with ranking badge */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border-2 transition-colors",
          useLightTheme 
            ? "bg-muted border-border group-hover:border-border/80" 
            : "bg-white/8 border-white/10 group-hover:border-white/20"
        )}>
          {item.image ? (
            <img 
              src={item.image} 
              alt="" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center bg-gradient-to-br text-white font-semibold text-sm",
              typeStyles.gradient
            )}>
              {getInitials(item.title)}
            </div>
          )}
        </div>
        
        {/* Ranking badge for courses */}
        {ranking && (
          <div className="absolute bottom-[-4px] left-[-4px] min-w-[22px] h-[22px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 shadow-sm" style={{ borderColor: '#F8FAFC' }}>
            #{ranking}
          </div>
        )}
        
        {/* Business indicator badge */}
        {item.type === 'business' && (
          <div className="absolute bottom-[-4px] left-[-4px] w-5 h-5 rounded-full flex items-center justify-center border-2 bg-purple-500" style={{ borderColor: '#F8FAFC' }}>
            <Building className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-base font-semibold truncate transition-colors",
          useLightTheme 
            ? "text-foreground group-hover:text-primary" 
            : "text-white group-hover:text-primary"
        )}>
          {highlightText(item.title)}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.type === 'course' && (
            <MapPin className={cn(
              "w-3 h-3 flex-shrink-0",
              useLightTheme ? "text-muted-foreground/50" : "text-white/40"
            )} />
          )}
          <span className={cn(
            "text-xs truncate",
            useLightTheme ? "text-muted-foreground" : "text-white/50"
          )}>{subtitleWithoutRanking}</span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className={cn(
        "h-5 w-5 flex-shrink-0 transition-colors",
        useLightTheme 
          ? "text-muted-foreground/30 group-hover:text-muted-foreground/50" 
          : "text-white/20 group-hover:text-white/40"
      )} />
    </button>
  );
};

export default SearchOverlay;
