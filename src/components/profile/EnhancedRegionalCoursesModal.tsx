import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Grid3X3, List, ChevronDown, Search, Lock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import CourseCard from '@/components/courses/CourseCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useModalState } from '@/hooks/useModalDetector';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ReviewWizard } from '@/components/courses/review-wizard';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { useUI } from '@/contexts/UIContext';
import { compareOwnRatings } from '@/lib/sortCoursesByRating';

import { CourseCardDraggable } from '@/components/CourseCardDraggable';

// File-local adapter: maps the modal's merged course row shape to the
// canonical OwnRatingRow shape consumed by `compareOwnRatings`.
const toOwnRatingRow = (c: any) => ({
  course_id: c.course_id ?? c.golf_courses?.id ?? '',
  rating: c.rating,
  design_score: c.design_score,
  condition_score: c.condition_score,
  clubhouse_score: c.clubhouse_score,
  facilities_score: c.facilities_score,
  review_date: c.review_date ?? c.created_at,
});

interface EnhancedRegionalCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string;
  courses: any[];
  isOwnProfile?: boolean;
  userId?: string;
  onCardClick?: (courseId: string, source?: string) => void;
}

type SortOption = 'recently-played' | 'highest-rated' | 'lowest-rated';
type ViewOption = 'grid' | 'list';

const sortCourses = (courses: any[], sortBy: SortOption) => {
  // Partition courses into played and unplayed
  const playedCourses = courses.filter(course => course.userPlayed === true);
  const unplayedCourses = courses.filter(course => course.userPlayed !== true);

  // Sort played courses by selected option
  let sortedPlayedCourses = [...playedCourses];
  switch (sortBy) {
    case 'recently-played':
      sortedPlayedCourses.sort((a, b) => {
        const aDate = new Date(a.lastPlayedAt || a.played_date || a.created_at || 0);
        const bDate = new Date(b.lastPlayedAt || b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      });
      break;
    
    case 'highest-rated':
      sortedPlayedCourses.sort((a, b) => {
        const aRating = a.rating ?? a.userRating;
        const bRating = b.rating ?? b.userRating;

        // Rated-vs-unrated guard (existing behaviour preserved)
        if (aRating && bRating) {
          // Tiers 1-3: canonical own-rating cascade (DESC)
          const canonical = compareOwnRatings(toOwnRatingRow(a), toOwnRatingRow(b), 'desc');
          if (canonical !== 0) return canonical;

          // Tier 4: community avg DESC (Enhanced-specific)
          const aGlobal = a.golf_courses?.average_rating ?? 0;
          const bGlobal = b.golf_courses?.average_rating ?? 0;
          if (aGlobal !== bGlobal) return bGlobal - aGlobal;

          // Tier 5: regional_rank ASC (lower rank = better; Enhanced-specific)
          const aRank = a.golf_courses?.regional_rank ?? a.golf_courses?.global_rank ?? 9999;
          const bRank = b.golf_courses?.regional_rank ?? b.golf_courses?.global_rank ?? 9999;
          if (aRank !== bRank) return aRank - bRank;

          // Tier 6: course_id ASC (stable final tiebreaker)
          return (a.course_id ?? '').localeCompare(b.course_id ?? '');
        }
        if (aRating && !bRating) return -1;
        if (!aRating && bRating) return 1;

        // Both played but unrated — community avg then regional_rank (existing)
        const aGlobalRating = a.golf_courses?.average_rating ?? 0;
        const bGlobalRating = b.golf_courses?.average_rating ?? 0;
        if (aGlobalRating !== bGlobalRating) return bGlobalRating - aGlobalRating;

        const aRank = a.golf_courses?.regional_rank ?? a.golf_courses?.global_rank ?? 9999;
        const bRank = b.golf_courses?.regional_rank ?? b.golf_courses?.global_rank ?? 9999;
        return aRank - bRank;
      });
      break;
    
    case 'lowest-rated':
      sortedPlayedCourses.sort((a, b) => {
        const aRating = a.rating ?? a.userRating;
        const bRating = b.rating ?? b.userRating;

        if (aRating && bRating) {
          // Tiers 1-3: canonical cascade with ASC primary (review_date stays DESC inside)
          const canonical = compareOwnRatings(toOwnRatingRow(a), toOwnRatingRow(b), 'asc');
          if (canonical !== 0) return canonical;

          // Tier 4: community avg ASC (flipped for "lowest")
          const aGlobal = a.golf_courses?.average_rating ?? 0;
          const bGlobal = b.golf_courses?.average_rating ?? 0;
          if (aGlobal !== bGlobal) return aGlobal - bGlobal;

          // Tier 5: regional_rank DESC (flipped — worse rank = "lower")
          const aRank = a.golf_courses?.regional_rank ?? a.golf_courses?.global_rank ?? 0;
          const bRank = b.golf_courses?.regional_rank ?? b.golf_courses?.global_rank ?? 0;
          if (aRank !== bRank) return bRank - aRank;

          // Tier 6: course_id ASC (stable, never flips)
          return (a.course_id ?? '').localeCompare(b.course_id ?? '');
        }
        if (aRating && !bRating) return -1;
        if (!aRating && bRating) return 1;

        // Both played but unrated — community avg then regional_rank (existing, flipped)
        const aGlobalRating = a.golf_courses?.average_rating ?? 0;
        const bGlobalRating = b.golf_courses?.average_rating ?? 0;
        if (aGlobalRating !== bGlobalRating) return aGlobalRating - bGlobalRating;

        const aRank = a.golf_courses?.regional_rank ?? a.golf_courses?.global_rank ?? 0;
        const bRank = b.golf_courses?.regional_rank ?? b.golf_courses?.global_rank ?? 0;
        return bRank - aRank;
      });
      break;
  }

  // Sort unplayed courses A-Z by name (always)
  const sortedUnplayedCourses = [...unplayedCourses].sort((a, b) => {
    const aName = a.golf_courses?.name || '';
    const bName = b.golf_courses?.name || '';
    return aName.localeCompare(bName);
  });

  // Return played courses first, then unplayed
  return [...sortedPlayedCourses, ...sortedUnplayedCourses];
};

const EnhancedRegionalCoursesModal: React.FC<EnhancedRegionalCoursesModalProps> = ({
  isOpen,
  onClose,
  regionName,
  courses,
  isOwnProfile = false,
  userId
}) => {
  const [view, setView] = useState<ViewOption>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recently-played');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewModalCourse, setReviewModalCourse] = useState<any>(null);
  const [entered, setEntered] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { modalTransition, beginTransition, endTransition } = useUI();
  
  // Register this modal with the modal detector
  useModalState(isOpen);

  // Close handler with transition guard
  const handleClose = useCallback(() => {
    if (modalTransition.inProgress) return;
    beginTransition('close');
    onClose();
  }, [modalTransition.inProgress, beginTransition, onClose]);

  // Exit complete handler
  const handleExitComplete = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    endTransition();
  }, [endTransition]);

  // Scroll lock management and ESC key handling
  useEffect(() => {
    if (!isOpen) return;
    
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !modalTransition.inProgress) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, modalTransition.inProgress, handleClose]);

  // Query to get ALL courses for the region (both played and unplayed)
  const { data: allRegionCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['allRegionCourses', regionName, userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get all courses for the region
      let query = supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          country,
          region,
          sub_country,
          continent,
          global_rank,
          regional_rank,
          usa_rank,
          description,
          thumbnail_image
        `);

      // Apply region-specific filters
      switch (regionName) {
        case 'Worldwide':
          query = query.lte('global_rank', 100);
          break;
        case 'Great Britain & Ireland':
          query = query
            .eq('country', 'Britain & Ireland')
            .lte('regional_rank', 100);
          break;
        case 'USA':
          query = query
            .eq('country', 'USA')
            .lte('usa_rank', 100);
          break;
        case 'Continental Europe':
          query = query
            .eq('continent', 'Europe')
            .neq('country', 'Britain & Ireland')
            .lte('regional_rank', 100);
          break;
        default:
          query = query
            .eq('region', regionName)
            .lte('regional_rank', 100);
      }

      const { data: allCourses, error: coursesError } = await query
        .order('global_rank', { ascending: true, nullsFirst: false })
        .order('regional_rank', { ascending: true, nullsFirst: false })
        .order('usa_rank', { ascending: true, nullsFirst: false });

      if (coursesError) throw coursesError;

      // Ratings-only: get user's ratings (canonical breakdown columns + review_date for cascade tiebreakers)
      const { data: userRatings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating, design_score, condition_score, clubhouse_score, facilities_score, review_date, created_at')
        .eq('user_id', userId);

      if (ratingsError) throw ratingsError;

      // Create ratings map
      const ratingsMap = new Map(userRatings?.map(r => [r.course_id, r]) || []);

      // Combine all data (ratings-only: played = has rating)
      const combinedCourses = allCourses?.map(course => {
        const ratingData = ratingsMap.get(course.id);
        
        return {
          course_id: course.id,
          golf_courses: course,
          userPlayed: ratingsMap.has(course.id),
          lastPlayedAt: ratingData?.created_at,
          rating: ratingData?.rating,
          created_at: ratingData?.created_at,
          design_score: ratingData?.design_score,
          condition_score: ratingData?.condition_score,
          clubhouse_score: ratingData?.clubhouse_score,
          facilities_score: ratingData?.facilities_score,
          review_date: ratingData?.review_date,
        };
      }) || [];

      return combinedCourses;
    },
    enabled: isOpen && entered && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query to get community ratings for courses
  const { data: communityRatings = {} } = useQuery({
    queryKey: ['communityRatings', allRegionCourses.map(c => c.golf_courses?.id).filter(Boolean)],
    queryFn: async () => {
      if (allRegionCourses.length === 0) return {};
      
      const courseIds = allRegionCourses.map(c => c.golf_courses?.id).filter(Boolean);
      if (courseIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .in('course_id', courseIds);

      if (error) throw error;
      
      // Calculate average ratings per course
      const ratingsByCourse: Record<string, number[]> = {};
      data?.forEach(rating => {
        if (!ratingsByCourse[rating.course_id]) {
          ratingsByCourse[rating.course_id] = [];
        }
        ratingsByCourse[rating.course_id].push(rating.rating);
      });

      // Calculate averages
      const averages: Record<string, number> = {};
      Object.entries(ratingsByCourse).forEach(([courseId, ratings]) => {
        if (ratings.length > 0) {
          const avg = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          averages[courseId] = Math.round(avg * 10) / 10; // Round to 1 decimal place
        }
      });

      return averages;
    },
    enabled: isOpen && entered && allRegionCourses.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mark as played - in ratings-only system, open rating modal instead
  const handleMarkAsPlayed = (courseId: string) => {
    const course = allRegionCourses.find(c => c.golf_courses.id === courseId);
    if (course) {
      setReviewModalCourse(course.golf_courses);
    }
  };

  // Reset search when modal opens/closes  
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Check if user has any played courses to determine default sort
  useEffect(() => {
    if (isOpen && entered && allRegionCourses.length > 0) {
      const hasPlayedCourses = allRegionCourses.some(course => course.userPlayed);
      setSortBy(hasPlayedCourses ? 'recently-played' : 'highest-rated');
    }
  }, [isOpen, entered, allRegionCourses]);

  // Defer expensive computations until after entrance
  const effectiveSearch = useDeferredValue(searchQuery);
  
  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!entered) return []; // Cheap placeholder during animation
    
    let filtered = allRegionCourses;

    // Apply search filter
    if (effectiveSearch.trim()) {
      const query = effectiveSearch.toLowerCase();
      filtered = allRegionCourses.filter(course => 
        course.golf_courses?.name?.toLowerCase().includes(query) ||
        course.golf_courses?.sub_country?.toLowerCase().includes(query) ||
        course.golf_courses?.region?.toLowerCase().includes(query) ||
        course.golf_courses?.country?.toLowerCase().includes(query)
      );
    }

    return sortCourses(filtered, sortBy);
  }, [entered, allRegionCourses, effectiveSearch, sortBy]);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'recently-played':
        return 'Recently Played';
      case 'highest-rated':
        return 'Highest Rated';
      case 'lowest-rated':
        return 'Lowest Rated';
      default:
        return 'Recently Played';
    }
  };

  // Responsive grid classes
  const getGridClasses = () => {
    if (view === 'list') return 'space-y-3';
    return isMobile ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-4 gap-4';
  };

  // Count played vs unplayed
  const playedCount = filteredAndSortedCourses.filter(c => c.userPlayed).length;
  const unplayedCount = filteredAndSortedCourses.length - playedCount;

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isOpen && (
        <motion.div
          key={`regional-${regionName}`}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          onAnimationStart={() => setEntered(false)}
          onAnimationComplete={() => setEntered(true)}
          className={`
            fixed z-[1000] flex
            ${isMobile 
              ? 'top-0 left-0 right-0 bottom-0' 
              : 'inset-0'
            }
          `}
        >
          {/* Backdrop - blocks all background interaction */}
          <button
            aria-label="Close modal"
            onClick={handleClose}
            className="fixed cursor-default inset-0 bg-white/10 backdrop-blur-xl"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />
          
          
          {/* Modal Panel */}
          <div 
            className={`
              fixed right-0 bg-background z-10
              ${isMobile 
                ? 'w-full top-0 bottom-0 shadow-lg' 
                : 'inset-y-0 w-full rounded-none shadow-2xl'
              }
            `}
            style={isMobile ? { height: '100dvh' } : undefined}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="h-full overflow-hidden flex flex-col relative">
              {/* Header with title and close button */}
              <div className="sticky top-0 z-10 bg-background border-b border-border md:rounded-none">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {regionName}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="focus:outline-none"
                    aria-label="Close modal"
                  >
                    <span className="text-black text-xl font-bold">✕</span>
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto bg-transparent">
                {/* Controls Row */}
      <div className="px-4 sm:px-6 pt-4 pb-0">
        {/* Mobile Layout: View Toggle, Stats, and Sort */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          {/* Left: View Toggle */}
           <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-none">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="h-8 px-3"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-8 px-3"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Center: Stats */}
          {filteredAndSortedCourses.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {playedCount} of {filteredAndSortedCourses.length} courses played
            </div>
          )}

          {/* Right: Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <span className="text-xs text-muted-foreground mr-2">Sort</span>
                {getSortLabel(sortBy)}
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-background border border-border shadow-lg z-[1100]"
              sideOffset={4}
            >
              <DropdownMenuItem 
                onClick={() => setSortBy('recently-played')}
                className={sortBy === 'recently-played' ? 'bg-muted' : ''}
              >
                Recently Played
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('highest-rated')}
                className={sortBy === 'highest-rated' ? 'bg-muted' : ''}
              >
                Highest Rated
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('lowest-rated')}
                className={sortBy === 'lowest-rated' ? 'bg-muted' : ''}
              >
                Lowest Rated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Layout: View Toggle, Stats, and Sort */}
        <div className="hidden md:flex md:items-center md:justify-between gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-none">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="h-8 px-3"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-8 px-3"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">List</span>
            </Button>
          </div>

          {/* Center: Stats */}
          {filteredAndSortedCourses.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {playedCount} of {filteredAndSortedCourses.length} courses played
            </div>
          )}

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <span className="text-xs text-muted-foreground mr-2">Sort</span>
                {getSortLabel(sortBy)}
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-background border border-border shadow-lg z-[1100]"
              sideOffset={4}
            >
              <DropdownMenuItem 
                onClick={() => setSortBy('recently-played')}
                className={sortBy === 'recently-played' ? 'bg-muted' : ''}
              >
                Recently Played
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('highest-rated')}
                className={sortBy === 'highest-rated' ? 'bg-muted' : ''}
              >
                Highest Rated
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('lowest-rated')}
                className={sortBy === 'lowest-rated' ? 'bg-muted' : ''}
              >
                Lowest Rated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses by name, location, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="pt-4 px-4 sm:px-6">
        {!entered ? (
          <div className="p-4 space-y-3">
            <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-24 w-full bg-muted animate-pulse rounded" />
            <div className="h-24 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : coursesLoading ? (
          <div className="flex items-center justify-center py-8">
            <InlineSpinner size="lg" />
          </div>
        ) : filteredAndSortedCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">
              {searchQuery.trim() 
                ? `No courses found matching "${searchQuery}".`
                : `No ${regionName} courses found.`
              }
            </p>
          </div>
        ) : (
          <div className={getGridClasses()}>
            {filteredAndSortedCourses.map((course, index) => {
              if (view === 'list') {
                // List view - show as compact rows
                return (
                  <CourseCardDraggable 
                    key={course.course_id || `${course.course_id}-${index}`}
                    course={{
                      id: course.golf_courses?.id || '',
                      name: course.golf_courses?.name || '',
                      country: course.golf_courses?.country || undefined,
                      sub_country: course.golf_courses?.sub_country || undefined,
                      region: course.golf_courses?.region || undefined,
                      thumbnail_image: course.golf_courses?.thumbnail_image || undefined,
                      global_rank: course.golf_courses?.global_rank,
                      regional_rank: course.golf_courses?.regional_rank,
                      usa_rank: course.golf_courses?.usa_rank,
                    }}
                    showAddButton={false}
                  >
                    <div className="flex items-center gap-4 p-3 border border-border rounded-none hover:bg-muted/50 transition-colors cursor-pointer relative">
                    {/* Lock overlay for unplayed courses */}
                    {!course.userPlayed && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/40 to-muted/60 rounded-none z-10 backdrop-blur-[1px]">
                        <Lock className="absolute top-2 right-2 w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    <div className="w-16 h-12 rounded-none overflow-hidden flex-shrink-0 bg-muted">
                      {course.golf_courses?.thumbnail_image ? (
                        <img 
                          src={course.golf_courses.thumbnail_image} 
                          alt={course.golf_courses?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                          <div className="w-8 h-8 bg-green-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{course.golf_courses?.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{course.golf_courses?.sub_country || course.golf_courses?.region || course.golf_courses?.country}</span>
                        {communityRatings[course.golf_courses?.id] && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <ClubhouseLogo size="xs" />
                              {communityRatings[course.golf_courses.id]}
                            </span>
                          </>
                        )}
                        {(course.rating || course.userRating) && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              ⭐ {course.rating || course.userRating}
                            </span>
                          </>
                        )}
                        {course.userPlayed && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              ✓ Played
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mark as played button for unplayed courses */}
                    {!course.userPlayed && isOwnProfile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsPlayed(course.golf_courses.id);
                        }}
                        className="z-20 relative bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-muted"
                      >
                        Add Rating
                       </Button>
                     )}
                     </div>
                   </CourseCardDraggable>
                 );
               }

                // Grid view - show full cards
                return (
                 <CourseCardDraggable
                   key={course.course_id || `${course.course_id}-${index}`}
                   course={{
                     id: course.golf_courses?.id || '',
                     name: course.golf_courses?.name || '',
                     country: course.golf_courses?.country || undefined,
                     sub_country: course.golf_courses?.sub_country || undefined,
                     region: course.golf_courses?.region || undefined,
                     thumbnail_image: course.golf_courses?.thumbnail_image || undefined,
                     global_rank: course.golf_courses?.global_rank,
                     regional_rank: course.golf_courses?.regional_rank,
                     usa_rank: course.golf_courses?.usa_rank,
                   }}
                   showAddButton={false}
                 >
                   <div className="aspect-[4/5] relative">
                  {/* Lock overlay for unplayed courses */}
                  {!course.userPlayed && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-muted/50 rounded-none z-20 backdrop-blur-[2px]">
                      <Lock className="absolute top-2 right-2 w-5 h-5 text-muted-foreground" />
                        {isOwnProfile && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsPlayed(course.golf_courses.id);
                              }}
                              className="w-full text-xs bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border-muted"
                            >
                              Add Rating
                            </Button>
                          </div>
                        )}
                    </div>
                  )}

                  <CourseCard
                    course={{
                      ...course.golf_courses,
                      average_rating: communityRatings[course.golf_courses?.id] || course.golf_courses?.average_rating
                    }}
                    userRating={course.rating || course.userRating}
                    viewContext="regional"
                    viewingUserId={userId}
                    isReadOnly={!isOwnProfile}
                    customHeight="h-full"
                    showUserRating={true}
                    showAverageRating={true}
                    badgesOnTop={true}
                    disableClick={false}
                    />
                   </div>
                 </CourseCardDraggable>
               );
            })}
          </div>
        )}
              </div>

              {/* Review Modal */}
              {reviewModalCourse && (
                <ReviewWizard
                  course={reviewModalCourse}
                  isOpen={!!reviewModalCourse}
                  onClose={() => setReviewModalCourse(null)}
                  isEditMode={false}
                />
              )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedRegionalCoursesModal;