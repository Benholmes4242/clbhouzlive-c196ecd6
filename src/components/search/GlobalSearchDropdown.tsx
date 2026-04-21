import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  User, 
  MapPin, 
  Building, 
  Clock, 
  Sparkles, 
  ChevronRight,
  X,
  Play,
  RefreshCw
} from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'business' | 'page' | 'video';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
  verified?: boolean;
  category?: 'people' | 'clubs_courses' | 'businesses' | 'pages_channels' | 'videos';
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface GlobalSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  recentSearches: RecentSearch[];
  popularItems: SearchResult[];
  onResultSelect: (result: SearchResult, position?: number) => void;
  onRecentSearchClick: (query: string, position?: number) => void;
  onClearRecentSearches: () => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  anchorRef?: React.RefObject<HTMLElement>;
  highlightQuery?: string;
}

const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({
  isOpen,
  onClose,
  query,
  results,
  isLoading,
  recentSearches,
  popularItems,
  onResultSelect,
  onRecentSearchClick,
  onClearRecentSearches,
  activeIndex,
  onActiveIndexChange,
  anchorRef,
  highlightQuery = query
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>();
  
  // Check if we're on clubhouse page to determine color scheme
  const isClubhousePage = location.pathname === '/clubhouse' || location.pathname === '/';
  
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Group results by category
  const groupedResults = React.useMemo(() => {
    const groups = {
      people: results.filter(r => r.type === 'user'),
      videos: results.filter(r => r.type === 'video'),
      clubs_courses: results.filter(r => r.type === 'course'),
      businesses: results.filter(r => r.type === 'business'),
      pages_channels: results.filter(r => r.type === 'page')
    };
    return groups;
  }, [results]);

  // Flatten all items for keyboard navigation
  const allItems = React.useMemo(() => {
    if (query.trim()) {
      return [
        ...groupedResults.people,
        ...groupedResults.videos,
        ...groupedResults.clubs_courses,
        ...groupedResults.businesses,
        ...groupedResults.pages_channels
      ];
    } else {
      return [
        ...recentSearches.map(r => ({ 
          id: r.id, 
          type: 'recent' as const, 
          title: r.query, 
          subtitle: 'Recent search',
          category: 'recent' as const
        })),
        ...popularItems.slice(0, 8)
      ];
    }
  }, [query, groupedResults, recentSearches, popularItems]);

  // Measure anchor width for matching dropdown width
  React.useLayoutEffect(() => {
    const el = anchorRef?.current;
    if (!el || isMobile) return;

    // Set immediately
    setDropdownWidth(el.getBoundingClientRect().width);

    // Keep in sync on resize
    const ro = new ResizeObserver(() => {
      setDropdownWidth(el.getBoundingClientRect().width);
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [anchorRef, isMobile]);

  // Highlight matching text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className={cn(
          "font-medium",
          isClubhousePage ? "bg-primary/20 text-primary" : "bg-[#F58220]/20 text-[#F58220]"
        )}>
          {part}
        </mark>
      ) : part
    );
  };

  // Get avatar/icon for result - returns icon only for non-image cases
  const getResultIcon = (result: any) => {
    const iconClass = isClubhousePage ? "h-5 w-5 text-white/70" : "h-5 w-5 text-black/70";
    switch (result.type) {
      case 'user':
        return <User className={iconClass} />;
      case 'video':
        return <Play className={iconClass} />;
      case 'course':
        return <MapPin className={iconClass} />;
      case 'business':
        return <Building className={iconClass} />;
      case 'page':
        return <Building className={iconClass} />;
      case 'recent':
        return <Clock className={iconClass} />;
      default:
        return <Search className={iconClass} />;
    }
  };




  // Loading shimmer rows
  const LoadingShimmer = () => (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className={cn(
            "w-10 h-10 rounded-full animate-pulse",
            isClubhousePage ? "bg-white/10" : "bg-black/10"
          )} />
          <div className="flex-1">
            <div className={cn(
              "w-32 h-4 animate-pulse rounded mb-1",
              isClubhousePage ? "bg-white/10" : "bg-black/10"
            )} />
            <div className={cn(
              "w-24 h-3 animate-pulse rounded",
              isClubhousePage ? "bg-white/5" : "bg-black/5"
            )} />
          </div>
        </div>
      ))}
    </>
  );

  // Empty state
  const EmptyState = () => (
    <div className="p-8 text-center">
      <Search className={cn(
        "h-12 w-12 mx-auto mb-4",
        isClubhousePage ? "text-white/30" : "text-black/30"
      )} />
      <p className={cn(
        "text-sm",
        isClubhousePage ? "text-white/60" : "text-black/60"
      )}>
        No matches. Try searching by name or club.
      </p>
    </div>
  );

  // Recent searches section
  const RecentSearchesSection = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn(
          "text-xs font-medium flex items-center gap-2",
          isClubhousePage ? "text-white/60" : "text-black/60"
        )}>
          <Clock className="h-3 w-3" />
          Recent searches
        </h3>
        <button
          onClick={onClearRecentSearches}
          className={cn(
            "text-xs transition-colors",
            isClubhousePage 
              ? "text-white/40 hover:text-white/60" 
              : "text-black/40 hover:text-black/60"
          )}
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentSearches.slice(0, 8).map((search, index) => (
          <button
            key={search.id}
            onClick={() => onRecentSearchClick(search.query, index)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full transition-colors",
              isClubhousePage
                ? "bg-white/10 hover:bg-white/20 text-white/80"
                : "bg-black/10 hover:bg-black/20 text-black/80"
            )}
          >
            {search.query}
          </button>
        ))}
      </div>
    </div>
  );

  // Today's Picks section (daily rotating content)
  const TrendingSection = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn(
          "text-xs font-medium flex items-center gap-2",
          isClubhousePage ? "text-white/60" : "text-black/60"
        )}>
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br",
            isClubhousePage ? "from-primary to-amber-500" : "from-orange-500 to-amber-500"
          )}>
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </div>
          Today's Picks
        </h3>
        <div className={cn(
          "flex items-center gap-1 text-[10px]",
          isClubhousePage ? "text-white/30" : "text-black/30"
        )}>
          <RefreshCw className="w-2 h-2" />
          <span>Daily</span>
        </div>
      </div>
      <div className="space-y-1">
        {popularItems.slice(0, 5).map((item, index) => (
          <button
            key={item.id}
            onClick={() => onResultSelect(item)}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
              activeIndex === index + recentSearches.length && (
                isClubhousePage ? "bg-white/10" : "bg-black/10"
              ),
              isClubhousePage ? "hover:bg-white/5" : "hover:bg-black/5"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-sq-sm flex items-center justify-center flex-shrink-0",
              isClubhousePage ? "bg-white/10" : "bg-black/10"
            )}>
              {getResultIcon(item)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-sm font-medium truncate",
                isClubhousePage ? "text-white" : "text-black"
              )}>
                {item.title}
              </div>
              <div className={cn(
                "text-xs truncate",
                isClubhousePage ? "text-white/60" : "text-black/60"
              )}>
                {item.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Result section with sticky header
  const ResultSection = ({ title, items, icon }: { title: string; items: SearchResult[]; icon: React.ReactNode }) => {
    if (items.length === 0) return null;

    return (
      <div className={cn(
        "border-t first:border-t-0",
        isClubhousePage ? "border-white/10" : "border-black/10"
      )}>
        {/* Sticky section header */}
        <div className={cn(
          "px-4 py-2 sticky top-0 z-[2] backdrop-blur-md",
          isClubhousePage 
            ? "bg-[rgba(10,10,10,0.85)]" 
            : "bg-[rgba(248,250,252,0.85)]"
        )}>
          <h3 className={cn(
            "text-xs font-medium flex items-center gap-2",
            isClubhousePage ? "text-white/60" : "text-black/60"
          )}>
            {icon}
            {title}
          </h3>
        </div>
        <div className={cn(
          "divide-y",
          isClubhousePage ? "divide-white/5" : "divide-black/5"
        )}>
          {items.map((item, index) => {
            const globalIndex = query.trim() 
              ? results.findIndex(r => r.id === item.id)
              : index;
            
            return (
              <button
                key={item.id}
                onClick={() => onResultSelect(item)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 min-h-[56px] transition-colors text-left group",
                  activeIndex === globalIndex && (
                    isClubhousePage 
                      ? "bg-white/10 ring-2 ring-primary/30" 
                      : "bg-black/10 ring-2 ring-[#F58220]/30"
                  ),
                  isClubhousePage
                    ? "hover:bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    : "hover:bg-black/5 focus:bg-black/10 focus:ring-2 focus:ring-[#F58220]/30 focus:outline-none"
                )}
              >
                {/* Avatar/Icon - uses global SquircleAvatar for SDS consistency */}
                <div className="flex-shrink-0">
                  {item.type === 'user' ? (
                    <SquircleAvatar
                      src={item.image}
                      alt={item.title}
                      size={40}
                      fallback={item.title ? getInitials(item.title) : '?'}
                      hideRing
                    />
                  ) : (
                    <SquircleAvatar
                      src={item.image}
                      alt={item.title}
                      size={40}
                      fallback={item.title ? getInitials(item.title) : '?'}
                      hideRing
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium truncate",
                    isClubhousePage ? "text-white" : "text-black"
                  )}>
                    {highlightText(item.title, highlightQuery)}
                  </div>
                  <div className={cn(
                    "text-xs truncate",
                    isClubhousePage ? "text-white/60" : "text-black/60"
                  )}>
                    {item.subtitle}
                  </div>
                </div>

                {/* Right indicator */}
                <ChevronRight className={cn(
                  "h-4 w-4 transition-colors flex-shrink-0",
                  isClubhousePage
                    ? "text-white/30 group-hover:text-white/50"
                    : "text-black/30 group-hover:text-black/50"
                )} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[330]",
        "rounded-2xl liquid-glass liquid-glass--elevated liquid-glass--dropdown",
        "text-left max-h-[70vh] overflow-auto",
        "md:max-h-[72vh] md:rounded-2xl",
        "w-full md:min-w-[480px] max-h-[60vh]",
        isMobile && "hidden" // Hide when mobile - will use portal instead
      )}
      style={{
        width: dropdownWidth,
        maxWidth: '90vw'
      }}
    >
      {isLoading && query.trim() && <LoadingShimmer />}
      {!isLoading && query.trim() && results.length === 0 && <EmptyState />}
      {!isLoading && query.trim() && results.length > 0 && (
        <>
          <ResultSection 
            title="People" 
            items={groupedResults.people} 
            icon={<User className="h-3 w-3" />}
          />
          <ResultSection 
            title="Videos" 
            items={groupedResults.videos} 
            icon={<Play className="h-3 w-3" />}
          />
          <ResultSection 
            title="Clubs & Courses" 
            items={groupedResults.clubs_courses} 
            icon={<MapPin className="h-3 w-3" />}
          />
          <ResultSection 
            title="Business Profiles" 
            items={groupedResults.businesses} 
            icon={<Building className="h-3 w-3" />}
          />
          <ResultSection 
            title="Pages & Channels" 
            items={groupedResults.pages_channels} 
            icon={<Building className="h-3 w-3" />}
          />
        </>
      )}
      {!isLoading && !query.trim() && (
        <>
          {recentSearches.length > 0 && <RecentSearchesSection />}
          {popularItems.length > 0 && <TrendingSection />}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-x-0 top-16 bottom-0 z-[330] pointer-events-auto">
        <div className="liquid-glass liquid-glass--elevated rounded-t-2xl overflow-hidden mx-0 h-full max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Mobile header */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b",
            isClubhousePage ? "border-white/10" : "border-black/10"
          )}>
            <h2 className={cn(
              "text-lg font-semibold",
              isClubhousePage ? "text-white" : "text-black"
            )}>Search</h2>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-full transition-colors",
                isClubhousePage
                  ? "hover:bg-white/10"
                  : "hover:bg-black/10"
              )}
            >
              <X className={cn(
                "h-5 w-5",
                isClubhousePage ? "text-white/70" : "text-black/70"
              )} />
            </button>
          </div>

          {isLoading && query.trim() && <LoadingShimmer />}
          {!isLoading && query.trim() && results.length === 0 && <EmptyState />}
          {!isLoading && query.trim() && results.length > 0 && (
            <>
              <ResultSection 
                title="People" 
                items={groupedResults.people} 
                icon={<User className="h-3 w-3" />}
              />
              <ResultSection 
                title="Clubs & Courses" 
                items={groupedResults.clubs_courses} 
                icon={<MapPin className="h-3 w-3" />}
              />
              <ResultSection 
                title="Business Profiles" 
                items={groupedResults.businesses} 
                icon={<Building className="h-3 w-3" />}
              />
              <ResultSection 
                title="Pages & Channels" 
                items={groupedResults.pages_channels} 
                icon={<Building className="h-3 w-3" />}
              />
            </>
          )}
          {!isLoading && !query.trim() && (
            <>
              {recentSearches.length > 0 && <RecentSearchesSection />}
              {popularItems.length > 0 && <TrendingSection />}
            </>
          )}
        </div>
      </div>
    );
  }

  return dropdownContent;
};

export default GlobalSearchDropdown;