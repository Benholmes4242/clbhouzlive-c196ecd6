import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Flag, Globe, SlidersHorizontal } from 'lucide-react';
import FeaturedCourseHero from './FeaturedCourseHero';
import Top100JourneySummary from './Top100JourneySummary';
import ExpandedRegionsSection from './ExpandedRegionsSection';
import DiscoverGridPPL from './DiscoverGridPPL';
import ExploreSearchSheet from './ExploreSearchSheet';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import ExploreSearchResults from './ExploreSearchResults';
import ExploreFiltersSheet, { 
  countActiveFilters 
} from './ExploreFiltersSheet';
import { useTrendingCourses, useExploreRegions } from '@/hooks/useExploreData';
import { useExplorePrefetch, RegionKey, ExploreMoment, ExploreFilters, TimeFilter, SortFilter } from '@/hooks/useExploreMoments';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { exploreMomentAdapter } from '@/adapters/exploreMomentAdapter';

interface ExploreTabProps {
  onMediaClick?: (item: any) => void;
  className?: string;
}

// Local storage key for filters
const EXPLORE_FILTERS_KEY = 'explore-filters';

// Enhanced filter options with icons
const EXPLORE_PILLS: { id: string; label: string; icon?: React.ElementType }[] = [
  { id: 'all', label: 'All' },
  { id: 'courses', label: 'Courses', icon: Flag },
  { id: 'regions', label: 'Regions', icon: Globe },
];

// Region metadata for carousels
const REGION_CONFIG: { key: RegionKey; title: string }[] = [
  { key: 'GBI', title: 'GB&I' },
  { key: 'EU', title: 'Europe' },
  { key: 'USA', title: 'USA' },
  { key: 'ROW', title: 'Rest of World' },
];

// Default filters
const DEFAULT_FILTERS: ExploreFilters = {
  timeFrame: 'all',
  region: 'all',
  sort: 'recent',
};

/**
 * ExploreTab - The aspirational discovery surface for golf places, courses, and journeys
 * 
 * Phase 3: Adds filter bottom sheet for time frame, region, and sort
 */
export const ExploreTab: React.FC<ExploreTabProps> = ({
  onMediaClick,
  className,
}) => {
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Prefetch explore data on mount
  useExplorePrefetch();
  
  // Fullscreen player hook
  const { openFullscreen } = useUnifiedFullscreen('explore-moments', {
    allowLandscape: true,
  });
  
  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  // Filter state
  const [filters, setFilters] = useState<ExploreFilters>(() => {
    try {
      const saved = localStorage.getItem(EXPLORE_FILTERS_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Search sheet state
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

  // Data hooks
  const { data: trendingCourses } = useTrendingCourses(20);
  const { data: regions } = useExploreRegions();

  // Active filter count
  const activeFilterCount = countActiveFilters(filters);

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
  }, []);

  const handleFilterChange = useCallback((key: string) => {
    setActiveFilter(key);
  }, []);

  const handleApplyFilters = useCallback((newFilters: ExploreFilters) => {
    setFilters(newFilters);
    try {
      localStorage.setItem(EXPLORE_FILTERS_KEY, JSON.stringify(newFilters));
    } catch {}
  }, []);

  // Build pills for command center - add filter button
  const pills: Pill[] = [
    ...EXPLORE_PILLS.map(p => ({
      key: p.id,
      label: p.label,
      selected: activeFilter === p.id,
    })),
  ];

  const handleSearchClick = useCallback(() => {
    setIsSearchSheetOpen(true);
  }, []);

  const handleStartJourney = () => {
    navigate('/top100');
  };

  const handleContinueJourney = () => {
    navigate('/top100');
  };

  // Handle moment click - opens fullscreen player with all moments
  const handleMomentClick = useCallback((moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => {
    openFullscreen(allMoments, index);
  }, [openFullscreen]);

  // Legacy handler for parent callback
  const handleItemClick = (item: any) => {
    onMediaClick?.(item);
  };

  // Filter button for command center
  const FilterButton = () => (
    <button
      onClick={() => setIsFilterSheetOpen(true)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        activeFilterCount > 0
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>Filters</span>
      {activeFilterCount > 0 && (
        <span className="ml-0.5 w-5 h-5 rounded-full bg-background text-foreground text-xs flex items-center justify-center font-semibold">
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  // Render content based on active filter
  const renderContent = () => {
    switch (activeFilter) {
      case 'courses':
        return (
          <div className="py-6">
            <div className="px-4 mb-4">
              <h2 className="text-lg font-bold text-foreground">All Courses</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover courses from around the world
              </p>
            </div>
            <div className="px-4 grid grid-cols-2 gap-3">
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
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
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
            <div className="px-4 mb-4">
              <h2 className="text-lg font-bold text-foreground">All Regions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Explore golf destinations around the world
              </p>
            </div>
            <div className="px-4 grid grid-cols-2 gap-3">
              {(regions || []).map(region => (
                <button
                  key={region.id}
                  onClick={() => navigate(`/discover/explore/region/${region.slug}`)}
                  className="text-left group"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-800 via-slate-700 to-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-base font-bold text-white">{region.title}</h4>
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
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center mx-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-950/50 dark:to-orange-900/30 flex items-center justify-center mb-4">
              <Bookmark className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Your Bucket List</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Save courses you dream of playing. We'll help you track your journey.
            </p>
            <button
              onClick={() => setActiveFilter('courses')}
              className="px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Explore Courses
            </button>
          </div>
        );

      default: // 'all'
        return (
          <>
            <FeaturedCourseHero onSearchClick={handleSearchClick} />
            <Top100JourneySummary
              onStartJourney={handleStartJourney}
              onContinueJourney={handleContinueJourney}
            />
            <div className="h-px bg-border/40 mx-4" />
            <ExpandedRegionsSection />
            
            <div className="h-px bg-border/40 mx-4" />
            
            {/* Filter button row */}
            <div className="px-4 pt-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Discover</h2>
              <FilterButton />
            </div>
            
            <DiscoverGridPPL 
              onMomentClick={handleMomentClick}
              filters={filters}
              showHeader={false}
            />
          </>
        );
    }
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Sticky Command Center: Search + Pills */}
      <div ref={searchContainerRef} className="sticky top-0 z-30 bg-background">
        <DiscoverCommandCenter
          searchPlaceholder="Search courses, regions..."
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          sortValue={sortOption}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleFilterChange}
          showSort={false}
        />
        
        {/* Search Results Overlay */}
        {showSearchResults && (
          <div className="px-4 relative">
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
      
      {/* Filters Sheet */}
      <ExploreFiltersSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        showRegionFilter={true}
      />
    </div>
  );
};

export default ExploreTab;
