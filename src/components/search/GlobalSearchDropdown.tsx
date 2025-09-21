import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  MapPin, 
  Building, 
  Clock, 
  TrendingUp, 
  Verified, 
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'page';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
  verified?: boolean;
  category?: 'people' | 'clubs_courses' | 'pages_channels';
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
  loading: boolean;
  recentSearches: RecentSearch[];
  popularItems: SearchResult[];
  onResultSelect: (result: SearchResult) => void;
  onRecentSearchClick: (query: string) => void;
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
  loading,
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
  const isMobile = useIsMobile();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // Group results by category
  const groupedResults = React.useMemo(() => {
    const groups = {
      people: results.filter(r => r.type === 'user'),
      clubs_courses: results.filter(r => r.type === 'course'),
      pages_channels: results.filter(r => r.type === 'page')
    };
    return groups;
  }, [results]);

  // Flatten all items for keyboard navigation
  const allItems = React.useMemo(() => {
    if (query.trim()) {
      return [
        ...groupedResults.people,
        ...groupedResults.clubs_courses,
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

  // Update position when anchor changes
  useEffect(() => {
    if (!isMobile && anchorRef?.current && isOpen) {
      const updatePosition = () => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isOpen, anchorRef, isMobile]);

  // Highlight matching text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary font-medium">
          {part}
        </mark>
      ) : part
    );
  };

  // Get avatar/icon for result
  const getResultIcon = (result: any) => {
    if (result.image) {
      return (
        <img 
          src={result.image} 
          alt="" 
          className="w-full h-full rounded-full object-cover"
        />
      );
    }

    const iconClass = "h-5 w-5 text-white/70";
    switch (result.type) {
      case 'user':
        return <User className={iconClass} />;
      case 'course':
        return <MapPin className={iconClass} />;
      case 'page':
        return <Building className={iconClass} />;
      case 'recent':
        return <Clock className={iconClass} />;
      default:
        return <Search className={iconClass} />;
    }
  };

  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Loading shimmer rows
  const LoadingShimmer = () => (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          <div className="flex-1">
            <div className="w-32 h-4 bg-white/10 animate-pulse rounded mb-1" />
            <div className="w-24 h-3 bg-white/5 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </>
  );

  // Empty state
  const EmptyState = () => (
    <div className="p-8 text-center">
      <Search className="h-12 w-12 text-white/30 mx-auto mb-4" />
      <p className="text-white/60 text-sm">
        No matches. Try searching by name or club.
      </p>
    </div>
  );

  // Recent searches section
  const RecentSearchesSection = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-white/60 flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Recent searches
        </h3>
        <button
          onClick={onClearRecentSearches}
          className="text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentSearches.slice(0, 8).map((search) => (
          <button
            key={search.id}
            onClick={() => onRecentSearchClick(search.query)}
            className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white/80 rounded-full transition-colors"
          >
            {search.query}
          </button>
        ))}
      </div>
    </div>
  );

  // Trending section
  const TrendingSection = () => (
    <div className="p-4">
      <h3 className="text-xs font-medium text-white/60 flex items-center gap-2 mb-3">
        <TrendingUp className="h-3 w-3" />
        Popular courses
      </h3>
      <div className="space-y-1">
        {popularItems.slice(0, 5).map((item, index) => (
          <button
            key={item.id}
            onClick={() => onResultSelect(item)}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
              activeIndex === index + recentSearches.length && "bg-white/10",
              "hover:bg-white/5"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              {getResultIcon(item)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {item.title}
              </div>
              <div className="text-xs text-white/60 truncate">
                {item.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Result section
  const ResultSection = ({ title, items, icon }: { title: string; items: SearchResult[]; icon: React.ReactNode }) => {
    if (items.length === 0) return null;

    return (
      <div className="border-t border-white/10 first:border-t-0">
        <div className="px-4 py-2 bg-white/5">
          <h3 className="text-xs font-medium text-white/60 flex items-center gap-2">
            {icon}
            {title}
          </h3>
        </div>
        <div className="divide-y divide-white/5">
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
                  activeIndex === globalIndex && "bg-white/10 ring-2 ring-primary/30",
                  "hover:bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                )}
              >
                {/* Avatar/Icon */}
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 relative">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-medium text-white">
                      {item.title ? getInitials(item.title) : getResultIcon(item)}
                    </div>
                  )}
                  {item.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Verified className="h-2.5 w-2.5 text-white" fill="currentColor" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {highlightText(item.title, highlightQuery)}
                  </div>
                  <div className="text-xs text-white/60 truncate">
                    {item.subtitle}
                  </div>
                </div>

                {/* Right indicator */}
                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/50 transition-colors flex-shrink-0" />
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
        "bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden",
        "max-h-[70vh] overflow-y-auto",
        isMobile ? "mx-4 mb-safe" : "min-w-[400px] max-w-[500px]"
      )}
      style={isMobile ? {} : {
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: Math.max(position.width, 400),
        zIndex: 9999
      }}
    >
      {/* Mobile header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Search</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>
      )}

      {loading && query.trim() && <LoadingShimmer />}

      {!loading && query.trim() && results.length === 0 && <EmptyState />}

      {!loading && query.trim() && results.length > 0 && (
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
            title="Pages & Channels" 
            items={groupedResults.pages_channels} 
            icon={<Building className="h-3 w-3" />}
          />
        </>
      )}

      {!loading && !query.trim() && (
        <>
          {recentSearches.length > 0 && <RecentSearchesSection />}
          {popularItems.length > 0 && <TrendingSection />}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-safe-or-16 bottom-0 flex flex-col">
          {dropdownContent}
        </div>
      </div>
    );
  }

  return dropdownContent;
};

export default GlobalSearchDropdown;