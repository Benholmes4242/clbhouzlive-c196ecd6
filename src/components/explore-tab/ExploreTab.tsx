import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, Flag, Globe, SlidersHorizontal, Compass, Loader2 } from 'lucide-react';
import FeaturedCourseHero from './FeaturedCourseHero';
import ReviewsOfTheWeekHero from './ReviewsOfTheWeekHero';
import Top100JourneySummary from './Top100JourneySummary';
import ExpandedRegionsSection from './ExpandedRegionsSection';
import DiscoverGrid from './DiscoverGrid';
import ExploreSearchSheet from './ExploreSearchSheet';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import ExploreSearchResults from './ExploreSearchResults';
import ExploreFiltersSheet, { 
  countActiveFilters 
} from './ExploreFiltersSheet';
import RegionBottomSheet, { RegionValue } from './RegionBottomSheet';
import ExploreErrorState from './ExploreErrorState';
import { useInfiniteTrendingCourses } from '@/hooks/useInfiniteTrendingCourses';
import { useExploreRegions } from '@/hooks/useExploreData';
import { useExplorePrefetch, RegionKey, ExploreMoment, ExploreFilters, TimeFilter, SortFilter } from '@/hooks/useExploreMoments';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { exploreMomentAdapter } from '@/adapters/exploreMomentAdapter';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

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

// Default filters
const DEFAULT_FILTERS: ExploreFilters = {
  timeFrame: 'all',
  region: 'all',
  sort: 'recent',
};

/**
 * ExploreTab - The aspirational discovery surface for golf places, courses, and journeys
 * 
 * Fix 2: Pull-to-refresh
 * Fix 6: Region filter on courses sub-tab
 * Fix 8: Error states for all sections
 * Fix 11: URL param consistency (?main=explore&sub=courses)
 * Fix 12: Dynamic header for courses sub-tab
 */
export const ExploreTab: React.FC<ExploreTabProps> = ({
  onMediaClick,
  className,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showFeaturedCourse, setShowFeaturedCourse] = useState(false);
  
  // Prefetch explore data on mount
  useExplorePrefetch();
  
  // Fullscreen player hook
  const { openFullscreen } = useUnifiedFullscreen('explore-moments', {
    allowLandscape: true,
  });
  
  // Fix 11: Read sub-tab from URL params for deep linking
  const activeFilter = searchParams.get('sub') || 'all';
  
  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
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
  
  // Region bottom sheet state
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);

  // Data hooks - Fix 5: Use infinite query for courses
  const {
    data: coursesData,
    isLoading: coursesLoading,
    error: coursesError,
    isFetchingNextPage: coursesFetchingNext,
    hasNextPage: coursesHasNext,
    fetchNextPage: coursesFetchNext,
    refetch: coursesRefetch,
  } = useInfiniteTrendingCourses(filters.region as RegionKey | 'all');
  
  const { data: regions } = useExploreRegions();

  // Flatten courses pages
  const allCourses = useMemo(() => {
    return coursesData?.pages.flatMap(page => page.courses) ?? [];
  }, [coursesData]);

  // Active filter count
  const activeFilterCount = countActiveFilters(filters);

  // Fix 5: Infinite scroll sentinel for courses
  const { ref: courseSentinelRef, inView: courseSentinelInView } = useInView({
    rootMargin: '200px',
  });
  
  useEffect(() => {
    if (courseSentinelInView && coursesHasNext && !coursesFetchingNext) {
      coursesFetchNext();
    }
  }, [courseSentinelInView, coursesHasNext, coursesFetchingNext, coursesFetchNext]);

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

  // Fix 11: Persist sub-tab in URL
  const handleFilterChange = useCallback((key: string) => {
    if (key === 'regions') {
      setIsRegionSheetOpen(true);
      return;
    }
    // Update URL with sub-tab
    const newParams = new URLSearchParams(searchParams);
    if (key === 'all') {
      newParams.delete('sub');
    } else {
      newParams.set('sub', key);
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleApplyFilters = useCallback((newFilters: ExploreFilters) => {
    setFilters(newFilters);
    try {
      localStorage.setItem(EXPLORE_FILTERS_KEY, JSON.stringify(newFilters));
    } catch {}
  }, []);

  // Handle region selection from bottom sheet — Fix 6: persists across sub-tabs
  const handleRegionChange = useCallback((region: RegionValue) => {
    setFilters(prev => {
      const newFilters = { ...prev, region };
      try {
        localStorage.setItem(EXPLORE_FILTERS_KEY, JSON.stringify(newFilters));
      } catch {}
      return newFilters;
    });
  }, []);

  // Get region label for pill
  const getRegionLabel = (region: RegionValue): string => {
    switch (region) {
      case 'GBI': return 'GB & Ireland';
      case 'EU': return 'Europe';
      case 'USA': return 'USA';
      case 'ROW': return 'Rest of World';
      default: return 'Regions';
    }
  };

  // Build pills for command center - region pill shows current selection
  const pills: Pill[] = EXPLORE_PILLS.map(p => ({
    key: p.id,
    label: p.id === 'regions' 
      ? getRegionLabel(filters.region)
      : p.label,
    selected: p.id === 'regions' 
      ? filters.region !== 'all'
      : activeFilter === p.id,
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

  // Handle moment click - opens fullscreen player with all moments
  const handleMomentClick = useCallback((moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => {
    openFullscreen(allMoments, index);
  }, [openFullscreen]);

  // Legacy handler for parent callback
  const handleItemClick = (item: any) => {
    onMediaClick?.(item);
  };

  // Fix 2: Pull-to-refresh handler
  const handlePullToRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reviews-of-the-week'] }),
      queryClient.invalidateQueries({ queryKey: ['user-top100-intent'] }),
      queryClient.invalidateQueries({ queryKey: ['regions-with-top-course'] }),
      queryClient.invalidateQueries({ queryKey: ['explore-moments'] }),
      queryClient.invalidateQueries({ queryKey: ['infinite-trending-courses'] }),
      queryClient.invalidateQueries({ queryKey: ['trending-courses'] }),
      queryClient.invalidateQueries({ queryKey: ['explore-regions'] }),
    ]);
  }, [queryClient]);

  // Fix 12: Dynamic header for courses sub-tab
  const coursesHeader = useMemo(() => {
    if (filters.region && filters.region !== 'all') {
      const regionName = getRegionLabel(filters.region);
      return {
        title: `Courses in ${regionName}`,
        subtitle: `Explore courses in this region`,
      };
    }
    return {
      title: 'All Courses',
      subtitle: 'Discover courses from around the world',
    };
  }, [filters.region]);

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
            {/* Fix 12: Dynamic header */}
            <div className="px-4 mb-4">
              <h2 className="text-lg font-bold text-foreground">{coursesHeader.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {coursesHeader.subtitle}
              </p>
            </div>
            
            {/* Fix 8: Error state */}
            {coursesError ? (
              <ExploreErrorState
                message="Couldn't load courses"
                onRetry={() => coursesRefetch()}
              />
            ) : coursesLoading && allCourses.length === 0 ? (
              /* Fix 7: Loading skeleton */
              <div className="px-4 grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : allCourses.length === 0 ? (
              /* Fix 7: Empty state */
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Compass className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-gray-600 mb-1">No courses found</p>
                <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                  {filters.region && filters.region !== 'all'
                    ? `No courses found in ${getRegionLabel(filters.region)}`
                    : 'Check back soon for more courses'}
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 grid grid-cols-2 gap-3">
                  {allCourses.map(course => (
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
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-800/50 via-slate-700/50 to-slate-900/50" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        {course.global_rank && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 backdrop-blur-md bg-black/35 border border-white/10 rounded-full text-xs text-white font-medium">
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
                
                {/* Fix 5: Infinite scroll sentinel */}
                {coursesHasNext && (
                  <div ref={courseSentinelRef} className="h-20" />
                )}
                
                {/* Loading more indicator */}
                {coursesFetchingNext && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                
                {/* End of courses */}
                {!coursesHasNext && allCourses.length > 0 && !coursesFetchingNext && (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs text-gray-400 font-medium">You've seen all courses</p>
                  </div>
                )}
              </>
            )}
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
              onClick={() => handleFilterChange('courses')}
              className="px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Explore Courses
            </button>
          </div>
        );

      default: // 'all'
        return (
          <>
            {!showFeaturedCourse ? (
              <ReviewsOfTheWeekHero 
                onFallbackToFeaturedCourse={() => setShowFeaturedCourse(true)}
              />
            ) : (
              <FeaturedCourseHero onSearchClick={handleSearchClick} />
            )}
            <Top100JourneySummary
              onStartJourney={handleStartJourney}
              onContinueJourney={handleContinueJourney}
            />
            <div className="h-px bg-border/40 mx-4" />
            <ExpandedRegionsSection />
            
            <div className="h-px bg-border/40 mx-4" />
            
            {/* Filter button row */}
            <div className="px-4 pt-4 pb-2 bg-white flex items-center justify-between border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#1e293b]">Discover Courses</h2>
              <FilterButton />
            </div>
            
            <DiscoverGrid 
              onMomentClick={handleMomentClick}
              filters={filters}
            />
          </>
        );
    }
  };

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      <div className={cn("min-h-screen bg-[#F8FAFC]", className)}>
        {/* Command Center: Search + Pills */}
        <div className="bg-[#F8FAFC]">
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
        
        {/* Region Bottom Sheet */}
        <RegionBottomSheet
          isOpen={isRegionSheetOpen}
          onOpenChange={setIsRegionSheetOpen}
          value={filters.region}
          onChange={handleRegionChange}
        />
      </div>
    </PullToRefreshContainer>
  );
};

export default ExploreTab;
