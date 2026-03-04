import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, Flag, Globe, SlidersHorizontal, Compass, Loader2, ChevronUp } from 'lucide-react';
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
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted
import { exploreMomentAdapter } from '@/adapters/exploreMomentAdapter';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

interface ExploreTabProps {
  onMediaClick?: (item: any) => void;
  className?: string;
}

const EXPLORE_FILTERS_KEY = 'explore-filters';

const EXPLORE_PILLS: { id: string; label: string; icon?: React.ElementType }[] = [
  { id: 'all', label: 'All' },
  { id: 'courses', label: 'Courses', icon: Flag },
  { id: 'regions', label: 'Regions', icon: Globe },
];

const DEFAULT_FILTERS: ExploreFilters = {
  timeFrame: 'all',
  region: 'all',
  sort: 'recent',
};

export const ExploreTab: React.FC<ExploreTabProps> = ({
  onMediaClick,
  className,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showFeaturedCourse, setShowFeaturedCourse] = useState(false);
  
  useExplorePrefetch();
  
  // TODO: Wire to new media player
  const openFullscreen = (...args: any[]) => console.log('[Fullscreen] TODO: Wire to new media player', args);
  
  const activeFilter = searchParams.get('sub') || 'all';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  const [filters, setFilters] = useState<ExploreFilters>(() => {
    try {
      const saved = localStorage.getItem(EXPLORE_FILTERS_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);

  // Scroll-to-top FAB state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const allCourses = useMemo(() => {
    return coursesData?.pages.flatMap(page => page.courses) ?? [];
  }, [coursesData]);

  const activeFilterCount = countActiveFilters(filters);

  const { ref: courseSentinelRef, inView: courseSentinelInView } = useInView({
    rootMargin: '200px',
  });
  
  useEffect(() => {
    if (courseSentinelInView && coursesHasNext && !coursesFetchingNext) {
      coursesFetchNext();
    }
  }, [courseSentinelInView, coursesHasNext, coursesFetchingNext, coursesFetchNext]);

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
    if (key === 'regions') {
      setIsRegionSheetOpen(true);
      return;
    }
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

  const handleRegionChange = useCallback((region: RegionValue) => {
    setFilters(prev => {
      const newFilters = { ...prev, region };
      try { localStorage.setItem(EXPLORE_FILTERS_KEY, JSON.stringify(newFilters)); } catch {}
      return newFilters;
    });
  }, []);

  const getRegionLabel = (region: RegionValue): string => {
    switch (region) {
      case 'GBI': return 'GB & Ireland';
      case 'EU': return 'Europe';
      case 'USA': return 'USA';
      case 'ROW': return 'Rest of World';
      default: return 'Regions';
    }
  };

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

  const handleStartJourney = () => navigate('/top100');
  const handleContinueJourney = () => navigate('/top100');

  const handleMomentClick = useCallback((moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => {
    openFullscreen(allMoments, index);
  }, [openFullscreen]);

  const handleItemClick = (item: any) => {
    onMediaClick?.(item);
  };

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

  // Filter button for Discover Courses section
  const FilterButton = () => (
    <button
      onClick={() => setIsFilterSheetOpen(true)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
        activeFilterCount > 0
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-white border-gray-200 text-gray-600"
      )}
    >
      <SlidersHorizontal className="w-3.5 h-3.5" />
      <span>Filters</span>
      {activeFilterCount > 0 && (
        <span className="ml-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-semibold">
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  const renderContent = () => {
    switch (activeFilter) {
      case 'courses':
        return (
          <div className="py-6">
            {/* Dynamic header */}
            <div className="px-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{coursesHeader.title}</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {coursesHeader.subtitle}
              </p>
            </div>
            
            {coursesError ? (
              <ExploreErrorState
                message="Couldn't load courses"
                onRetry={() => coursesRefetch()}
              />
            ) : coursesLoading && allCourses.length === 0 ? (
              /* Loading skeleton */
              <div className="px-4 grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-50">
                    <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : allCourses.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Compass className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600 mb-1">No courses found</p>
                <p className="text-sm text-gray-400 text-center max-w-[280px]">
                  {filters.region && filters.region !== 'all'
                    ? `No courses found in ${getRegionLabel(filters.region)}`
                    : 'Check back soon for more courses'}
                </p>
              </div>
            ) : (
              <>
                {/* 2-column course directory grid */}
                <div className="px-4 grid grid-cols-2 gap-3">
                  {allCourses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="text-left rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-50 active:scale-[0.98] transition-transform"
                    >
                      <div className="relative aspect-[4/3]">
                        {course.thumbnail_image ? (
                          <img 
                            src={course.thumbnail_image} 
                            alt={course.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-800/50 via-slate-700/50 to-slate-900/50" />
                        )}
                        {/* Bottom gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Top 100 ranking badge */}
                        {course.global_rank && (
                          <div className="absolute top-2.5 left-2.5 backdrop-blur-md bg-black/40 rounded-lg px-2 py-1 text-xs font-bold text-white">
                            #{course.global_rank}
                          </div>
                        )}
                        
                        {/* Course name + country */}
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
                          <h4 className="text-sm font-semibold text-white line-clamp-2">{course.name}</h4>
                          <p className="text-xs text-white/70 mt-0.5 line-clamp-1">
                            {course.sub_country || course.country}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Infinite scroll sentinel */}
                {coursesHasNext && (
                  <div ref={courseSentinelRef} className="h-20" />
                )}
                
                {coursesFetchingNext && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mb-4">
              <Bookmark className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your Bucket List</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              Save courses you dream of playing. We'll help you track your journey.
            </p>
            <button
              onClick={() => handleFilterChange('courses')}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl transition-opacity"
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
            
            <ExpandedRegionsSection />
            
            {/* Discover Courses section header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Discover Courses</h2>
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
        {/* Command Center */}
        <div className="bg-[#F8FAFC]">
          <DiscoverCommandCenter
            searchPlaceholder="Search courses, regions…"
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
            <div className="px-4 relative" ref={searchContainerRef}>
              <ExploreSearchResults
                query={searchQuery}
                onSelect={handleSearchResultSelect}
              />
            </div>
          )}
        </div>

        {renderContent()}
        
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

        {/* Scroll-to-Top FAB */}
        <button
          onClick={handleScrollToTop}
          className={cn(
            "fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center",
            "transition-all duration-200",
            showScrollTop 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-75 pointer-events-none"
          )}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </PullToRefreshContainer>
  );
};

export default ExploreTab;
