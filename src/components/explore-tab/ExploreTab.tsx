import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ExploreHero from './ExploreHero';
import Top100JourneySummary from './Top100JourneySummary';
import ExploreRegionCards from './ExploreRegionCards';
import DiscoverMomentsGrid from './DiscoverMomentsGrid';
import ExploreSearchSheet from './ExploreSearchSheet';
import NewThisWeekCarousel from './NewThisWeekCarousel';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import ExploreSearchResults from './ExploreSearchResults';
import { useTrendingCourses, useExploreRegions } from '@/hooks/useExploreData';
import { useExplorePrefetch, RegionKey } from '@/hooks/useExploreMoments';

interface ExploreTabProps {
  onMediaClick?: (item: any) => void;
  className?: string;
}

// Local storage key
const EXPLORE_SORT_KEY = 'explore-sort-option';

const EXPLORE_PILLS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'courses', label: 'Courses' },
  { id: 'regions', label: 'Regions' },
  { id: 'bucket-list', label: 'Bucket List' },
];

// Region metadata for carousels
const REGION_CONFIG: { key: RegionKey; title: string }[] = [
  { key: 'GBI', title: 'Great Britain & Ireland' },
  { key: 'EU', title: 'Continental Europe' },
  { key: 'USA', title: 'United States' },
  { key: 'ROW', title: 'Rest of World' },
];

/**
 * ExploreTab - The aspirational discovery surface for golf places, courses, and journeys
 * 
 * Phase 2:
 * - Trending support (7 days weighted by engagement)
 * - "New this week in [Region]" micro-carousels
 * - Caching + prefetch for instant tab switching
 */
export const ExploreTab: React.FC<ExploreTabProps> = ({
  onMediaClick,
  className,
}) => {
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Prefetch explore data on mount
  useExplorePrefetch();
  
  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem(EXPLORE_SORT_KEY);
    return (saved as SortOption) || 'newest';
  });
  
  // Search sheet state
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

  // Data hooks
  const { data: trendingCourses } = useTrendingCourses(20);
  const { data: regions } = useExploreRegions();

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchResults(value.trim().length >= 2);
  }, []);

  const handleSearchResultSelect = useCallback(() => {
    setShowSearchResults(false);
    setSearchQuery('');
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
    localStorage.setItem(EXPLORE_SORT_KEY, sort);
  }, []);

  const handleFilterChange = useCallback((key: string) => {
    setActiveFilter(key);
  }, []);

  // Build pills for command center
  const pills: Pill[] = EXPLORE_PILLS.map(p => ({
    key: p.id,
    label: p.label,
    selected: activeFilter === p.id,
  }));

  const handleSearchClick = useCallback(() => {
    setIsSearchSheetOpen(true);
  }, []);

  const handleStartJourney = () => {
    navigate('/top100');
  };

  const handleContinueJourney = () => {
    navigate('/top100');
  };

  const handleItemClick = (item: any) => {
    onMediaClick?.(item);
  };

  // Render content based on active filter
  const renderContent = () => {
    switch (activeFilter) {
      case 'courses':
        return (
          <div className="py-6">
            <div className="px-5 mb-4">
              <h3 className="text-lg font-serif text-foreground">All Courses</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover courses from around the world
              </p>
            </div>
            <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(trendingCourses || []).map(course => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="text-left group"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
                    {course.thumbnail_image ? (
                      <img 
                        src={course.thumbnail_image} 
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-800/50 via-slate-700/50 to-slate-900/50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {course.global_rank && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded-full text-xs text-white font-medium">
                        #{course.global_rank}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-sm font-medium text-white line-clamp-2">{course.name}</h4>
                      <p className="text-xs text-white/60 mt-0.5 line-clamp-1">
                        {course.sub_country || course.country}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'regions':
        return (
          <div className="py-6">
            <div className="px-5 mb-4">
              <h3 className="text-lg font-serif text-foreground">All Regions</h3>
            </div>
            <div className="px-5 grid grid-cols-2 gap-3">
              {(regions || []).map(region => (
                <button
                  key={region.id}
                  onClick={() => navigate(`/discover/explore/region/${region.slug}`)}
                  className="text-left group"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-800 via-slate-700 to-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-base font-medium text-white">{region.title}</h4>
                      {region.subtitle && (
                        <p className="mt-1 text-xs text-white/70">{region.subtitle}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'bucket-list':
        return (
          <div className="px-5 py-16 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto rounded-full bg-surface-alt/60 flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-serif text-foreground">No bucket list courses yet</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Save courses from Explore to build your list.
              </p>
              <button
                onClick={() => setActiveFilter('courses')}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Browse courses
              </button>
            </div>
          </div>
        );

      default: // 'all'
        return (
          <>
            <ExploreHero onSearchClick={handleSearchClick} />
            <Top100JourneySummary
              onStartJourney={handleStartJourney}
              onContinueJourney={handleContinueJourney}
            />
            <div className="h-px bg-border/40 mx-5" />
            <ExploreRegionCards />
            
            {/* New this week micro-carousels */}
            <div className="h-px bg-border/40 mx-5" />
            <div className="py-2">
              {REGION_CONFIG.map(region => (
                <NewThisWeekCarousel
                  key={region.key}
                  regionKey={region.key}
                  regionTitle={region.title}
                  onMomentClick={handleItemClick}
                />
              ))}
            </div>
            
            <div className="h-px bg-border/40 mx-5" />
            <DiscoverMomentsGrid onMomentClick={handleItemClick} />
          </>
        );
    }
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Sticky Command Center: Search + Sort + Pills */}
      <div ref={searchContainerRef} className="sticky top-0 z-30 bg-background">
        <DiscoverCommandCenter
          searchPlaceholder="Search courses, regions..."
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          sortValue={sortOption}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleFilterChange}
        />
        
        {/* Search Results Overlay */}
        {showSearchResults && (
          <div className="px-5 relative">
            <ExploreSearchResults
              query={searchQuery}
              onSelect={handleSearchResultSelect}
            />
          </div>
        )}
      </div>

      {renderContent()}
      
      {/* Bottom spacing */}
      <div className="h-8" />
      
      {/* Search Sheet */}
      <ExploreSearchSheet 
        isOpen={isSearchSheetOpen} 
        onClose={() => setIsSearchSheetOpen(false)} 
      />
    </div>
  );
};

export default ExploreTab;
