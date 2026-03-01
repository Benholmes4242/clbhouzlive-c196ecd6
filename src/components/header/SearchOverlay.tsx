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
        background: '#F8FAFC',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
      }}
      aria-modal
      role="dialog"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2.5 pb-1">
        <div className="w-9 h-1 rounded-full" style={{ background: '#E0E0E0' }} />
      </div>

      {/* Header with search bar */}
      <div className="flex-shrink-0 px-4 pt-2 pb-3">
        <div className="flex items-center gap-3">
          {/* Close button — 40x40 canonical target */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
            aria-label="Close search"
          >
            <X size={20} className="text-foreground/70" />
          </button>

          {/* Search input — canonical search bar: h-11, rounded-2xl, amber focus ring */}
          <div
            className="flex-1 h-11 rounded-2xl bg-muted/50 border border-border/50 px-3.5 flex items-center gap-3 transition-all focus-within:shadow-lg focus-within:border-primary/40 focus-within:ring-[3px] focus-within:ring-primary/15"
          >
            <Search size={18} className="text-muted-foreground/60 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search players, courses, businesses…"
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full hover:bg-muted/80 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} className="text-muted-foreground/60" />
              </button>
            )}
          </div>
        </div>
        {/* Search hint */}
        {!query && (
          <p className="text-xs mt-2 px-1 text-muted-foreground/50">
            Try "Pebble Beach", "@username", or "Augusta"
          </p>
        )}
      </div>

      {/* Inset divider — canonical: mx-4 h-px bg-border/40 */}
      <div className="mx-4 h-px bg-border/40" />

      {/* Results area */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-2xl mx-auto px-3 py-4 pb-safe">
          
          {/* Loading state */}
          {isLoading && query.trim() && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 rounded bg-muted" />
                    <div className="w-24 h-3 rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state — canonical: bg-primary/10 circle + text-primary icon */}
          {showEmpty && (
            <div className="py-16 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                We couldn't find any matches for "{query}". Try a different course, player, or business.
              </p>
              {/* Suggestion chips */}
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Pebble Beach', 'St Andrews', 'Augusta'].map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3.5 py-2 rounded-xl text-sm font-medium bg-muted/50 hover:bg-primary/[0.06] active:bg-primary/10 text-foreground/80 transition-colors"
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
            <div className="space-y-5">
              {/* People section */}
              {peopleResults.length > 0 && (
                <div>
                  <SectionHeader icon={User} label="People" color="blue" />
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
                  <SectionHeader icon={MapPin} label="Clubs & Courses" color="amber" />
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
                  <SectionHeader icon={Building} label="Business Profiles" color="purple" />
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
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                      Recent
                    </p>
                    <button
                      onClick={clearRecentSearches}
                      className="py-1 px-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors active:scale-[0.97]"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {recent.slice(0, 8).map((search) => (
                      <button
                        key={search.id}
                        onClick={() => handleRecentSearchClick(search.query)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/[0.06] active:bg-primary/10 transition-colors text-left"
                      >
                        <Clock size={16} className="text-muted-foreground/40 shrink-0" />
                        <span className="text-sm text-foreground/80 truncate">{search.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Picks */}
              {popularItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-primary to-amber-500">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                        Today's Picks
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Updates daily</span>
                    </div>
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

          {/* True empty — no query, no recent, no trending */}
          {!query.trim() && recent.length === 0 && popularItems.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-20">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search size={24} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Search for anything</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Section header component
interface SectionHeaderProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  color: 'blue' | 'amber' | 'purple';
}

const colorMap = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  amber: { bg: 'bg-primary/10', text: 'text-primary' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, label, color }) => {
  const c = colorMap[color];
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", c.bg)}>
        <Icon className={cn("h-3.5 w-3.5", c.text)} />
      </div>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">{label}</span>
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
  const highlightText = (text: string) => {
    if (!query.trim() || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="bg-primary/[0.18] rounded-sm">{part}</span>
      ) : part
    );
  };

  const getTypeStyles = () => {
    switch (item.type) {
      case 'user':
        return { gradient: 'from-blue-500 to-blue-600', label: 'Golfer' };
      case 'business':
        return { gradient: 'from-purple-500 to-purple-600', label: 'Business' };
      case 'course':
        return { gradient: 'from-green-600 to-emerald-600', label: 'Course' };
      default:
        return { gradient: 'from-muted-foreground/40 to-muted-foreground/60', label: '' };
    }
  };

  const typeStyles = getTypeStyles();
  const subtitleWithoutRanking = item.subtitle.replace(/\s*•\s*#\d+/, '');

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group active:scale-[0.99]",
        isActive 
          ? "bg-primary/[0.06] ring-1 ring-primary/20" 
          : "hover:bg-primary/[0.06] active:bg-primary/10"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden border border-border/50 group-hover:border-border/80 transition-colors bg-muted/50">
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
        
        {item.type === 'business' && (
          <div className="absolute bottom-[-3px] left-[-3px] w-5 h-5 rounded-full flex items-center justify-center border-2 bg-purple-500" style={{ borderColor: '#F8FAFC' }}>
            <Building className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
          {highlightText(item.title)}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.type === 'course' && (
            <MapPin className="w-3 h-3 flex-shrink-0 text-muted-foreground/40" />
          )}
          <span className="text-xs truncate text-muted-foreground">{subtitleWithoutRanking}</span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
    </button>
  );
};

export default SearchOverlay;
