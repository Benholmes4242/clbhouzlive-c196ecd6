import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import PostPlayRatingModal from '@/components/courses/PostPlayRatingModal';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import { AnimatePresence, motion } from 'framer-motion';
import { useUI } from '@/contexts/UIContext';

import { CourseCardDraggable } from '@/components/CourseCardDraggable';

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
        const aUserRating = a.rating || a.userRating;
        const bUserRating = b.rating || b.userRating;
        const aGlobalRating = a.golf_courses?.average_rating || 0;
        const bGlobalRating = b.golf_courses?.average_rating || 0;
        
        if (aUserRating && bUserRating) {
          return bUserRating - aUserRating;
        }
        if (aUserRating && !bUserRating) return -1;
        if (!aUserRating && bUserRating) return 1;
        
        if (aGlobalRating !== bGlobalRating) {
          return bGlobalRating - aGlobalRating;
        }
        
        const aRank = a.golf_courses?.regional_rank || a.golf_courses?.global_rank || 9999;
        const bRank = b.golf_courses?.regional_rank || b.golf_courses?.global_rank || 9999;
        return aRank - bRank;
      });
      break;
    
    case 'lowest-rated':
      sortedPlayedCourses.sort((a, b) => {
        const aUserRating = a.rating || a.userRating;
        const bUserRating = b.rating || b.userRating;
        const aGlobalRating = a.golf_courses?.average_rating || 0;
        const bGlobalRating = b.golf_courses?.average_rating || 0;
        
        if (aUserRating && bUserRating) {
          return aUserRating - bUserRating;
        }
        if (aUserRating && !bUserRating) return -1;
        if (!aUserRating && bUserRating) return 1;
        
        if (aGlobalRating !== bGlobalRating) {
          return aGlobalRating - bGlobalRating;
        }
        
        const aRank = a.golf_courses?.regional_rank || a.golf_courses?.global_rank || 0;
        const bRank = b.golf_courses?.regional_rank || b.golf_courses?.global_rank || 0;
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
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { modalTransition, beginTransition, endTransition } = useUI();
  
  // Create a stable key for the modal that changes when it reopens
  const [modalKey, setModalKey] = useState(0);
  
  // Register this modal with the modal detector
  useModalState(isOpen);

  // Update modal key when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalKey(prev => prev + 1);
    }
  }, [isOpen]);

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

      // Get user's played courses data from BOTH sources (like working carousel)
      const [userTop100Data, userRatingsData] = await Promise.all([
        supabase
          .from('user_top100_courses')
          .select('course_id, played, created_at')
          .eq('user_id', userId)
          .eq('played', true),
        
        supabase
          .from('course_ratings')
          .select('course_id, created_at')
          .eq('user_id', userId)
      ]);

      if (userTop100Data.error) throw userTop100Data.error;
      if (userRatingsData.error) throw userRatingsData.error;

      // Get user's ratings
      const { data: userRatings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id, rating, created_at')
        .eq('user_id', userId);

      if (ratingsError) throw ratingsError;

      // Combine played courses from both sources
      const allPlayedCourseIds = new Set([
        ...(userTop100Data.data?.map(p => p.course_id) || []),
        ...(userRatingsData.data?.map(r => r.course_id) || [])
      ]);

      // Create lookup maps
      const playedMap = new Map();
      // Add from user_top100_courses
      userTop100Data.data?.forEach(p => {
        playedMap.set(p.course_id, p);
      });
      // Add from course_ratings (if not already present from top100)
      userRatingsData.data?.forEach(r => {
        if (!playedMap.has(r.course_id)) {
          playedMap.set(r.course_id, { 
            course_id: r.course_id, 
            played: true, 
            created_at: r.created_at 
          });
        }
      });

      const ratingsMap = new Map(userRatings?.map(r => [r.course_id, r]) || []);

      // Combine all data
      const combinedCourses = allCourses?.map(course => {
        const playedData = playedMap.get(course.id);
        const ratingData = ratingsMap.get(course.id);
        
        return {
          course_id: course.id,
          golf_courses: course,
          userPlayed: allPlayedCourseIds.has(course.id),
          lastPlayedAt: playedData?.created_at,
          rating: ratingData?.rating,
          created_at: ratingData?.created_at
        };
      }) || [];

      return combinedCourses;
    },
    enabled: isOpen && !!userId,
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
    enabled: isOpen && allRegionCourses.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mark as played mutation
  const markAsPlayedMutation = useMutation({
    mutationFn: async ({ courseId }: { courseId: string }) => {
      const { error } = await supabase
        .from('user_top100_courses')
        .upsert({
          user_id: userId!,
          course_id: courseId,
          played: true,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => {
      queryClient.invalidateQueries({ queryKey: ['allRegionCourses'] });
      toast.success('Course marked as played!', {
        action: {
          label: 'Add Review',
          onClick: () => {
            const course = allRegionCourses.find(c => c.golf_courses.id === courseId);
            if (course) {
              setReviewModalCourse(course.golf_courses);
            }
          }
        }
      });
    },
    onError: () => {
      toast.error('Failed to mark course as played');
    }
  });

  // Reset search when modal opens/closes  
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Check if user has any played courses to determine default sort
  useEffect(() => {
    if (isOpen && allRegionCourses.length > 0) {
      const hasPlayedCourses = allRegionCourses.some(course => course.userPlayed);
      setSortBy(hasPlayedCourses ? 'recently-played' : 'highest-rated');
    }
  }, [isOpen, allRegionCourses]);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = allRegionCourses;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allRegionCourses.filter(course => 
        course.golf_courses?.name?.toLowerCase().includes(query) ||
        course.golf_courses?.sub_country?.toLowerCase().includes(query) ||
        course.golf_courses?.region?.toLowerCase().includes(query) ||
        course.golf_courses?.country?.toLowerCase().includes(query)
      );
    }

    return sortCourses(filtered, sortBy);
  }, [allRegionCourses, searchQuery, sortBy]);

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
          key={`regional-${regionName}-${modalKey}`}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          className={`
            fixed z-[1000] flex
            ${isMobile 
              ? 'top-0 left-0 right-0 bottom-16' 
              : 'inset-0'
            }
          `}
        >
          {/* Backdrop - blocks all background interaction */}
          <button
            aria-label="Close modal"
            onClick={handleClose}
            className={`
              fixed bg-black/50 cursor-default
              ${isMobile 
                ? 'top-0 left-0 right-0 bottom-16' 
                : 'inset-0'
              }
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />
          
          {/* Modal Panel */}
          <div 
            className={`
              fixed right-0 bg-background shadow-2xl z-10
              ${isMobile 
                ? 'w-full top-0 bottom-16' 
                : 'inset-y-0 w-[90vw] max-w-[860px] rounded-l-2xl'
              }
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="h-full overflow-hidden flex flex-col relative">
              {/* Header with title and close button */}
              <div className="sticky top-0 z-10 bg-background border-b border-border">
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
              <div className="flex-1 overflow-auto">
                {/* Controls Row */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
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


        {/* Stats */}
        {playedCount > 0 && (
          <div className="mt-3 text-sm text-muted-foreground">
            {playedCount} played • {unplayedCount} not played yet
          </div>
        )}
      </div>
      
      {/* Scrollable Content */}
      <div className="p-4 sm:p-6">
        {coursesLoading ? (
          <div className="flex items-center justify-center py-2">
            <ClubhouzLoading />
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
                    <div className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer relative">
                    {/* Lock overlay for unplayed courses */}
                    {!course.userPlayed && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/40 to-muted/60 rounded-lg z-10 backdrop-blur-[1px]">
                        <Lock className="absolute top-2 right-2 w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
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
                          markAsPlayedMutation.mutate({ courseId: course.golf_courses.id });
                        }}
                        disabled={markAsPlayedMutation.isPending}
                        className="z-20 relative bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-muted"
                      >
                        {markAsPlayedMutation.isPending ? 'Adding...' : 'Mark as Played'}
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
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-muted/50 rounded-lg z-20 backdrop-blur-[2px]">
                      <Lock className="absolute top-2 right-2 w-5 h-5 text-muted-foreground" />
                      {isOwnProfile && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsPlayedMutation.mutate({ courseId: course.golf_courses.id });
                            }}
                            disabled={markAsPlayedMutation.isPending}
                            className="w-full text-xs bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border-muted"
                          >
                            {markAsPlayedMutation.isPending ? 'Adding...' : 'Mark as Played'}
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
                <PostPlayRatingModal
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