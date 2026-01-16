import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronUp, ChevronDown, MapPin, Earth, Target } from 'lucide-react';
import { CiCircleList } from 'react-icons/ci';
import { MdFitScreen } from 'react-icons/md';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import CourseRankBadges from './CourseRankBadges';
import CourseVideoOverlay from './CourseVideoOverlay';
import AddToPlayedModal from './AddToPlayedModal';
import { useCourseVideos } from '@/hooks/useCourseVideos';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface GBITestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  thumbnail_image?: string;
  regional_rank?: number;
  global_rank?: number;
  description?: string;
}

const GBITestModal: React.FC<GBITestModalProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'fullscreen' | 'list'>('fullscreen');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAddToPlayedModal, setShowAddToPlayedModal] = useState(false);
  const [playedCourses, setPlayedCourses] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();
  const navigate = useNavigate();

  // Fetch GB & I Top 100 courses with optimized caching
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['gbi-top-100-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, region, sub_country, thumbnail_image, regional_rank, global_rank, description')
        .eq('country', 'Britain & Ireland')
        .not('regional_rank', 'is', null)
        .lte('regional_rank', 100)
        .order('regional_rank', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes - courses don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });

  // Query to get user's rated courses (ratings-only)
  const { data: userPlayedCourses = [] } = useQuery({
    queryKey: ['userRatedCoursesGBI', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Ratings-only: played = has rating
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query to get community ratings for courses
  const { data: communityRatings = [] } = useQuery({
    queryKey: ['communityRatingsGBI', courses.map(c => c.id)],
    queryFn: async () => {
      if (courses.length === 0) return [];
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .in('course_id', courses.map(c => c.id));

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
    enabled: isOpen && courses.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
  });

  // Update played courses set when data changes
  useEffect(() => {
    const playedSet: Set<string> = new Set(
      userPlayedCourses.map((pc) => pc.course_id as string)
    );
    setPlayedCourses(playedSet);
  }, [userPlayedCourses]);

  // Handle Add to Played button click
  const handleAddToPlayed = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setSelectedCourse(course);
    setShowAddToPlayedModal(true);
  };

  // Handle successful course addition
  const handlePlayedSuccess = () => {
    setShowAddToPlayedModal(false);
    // The query will automatically refetch due to invalidation in the modal
  };

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < courses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, courses.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Jump to specific course index
  const jumpToIndex = useCallback((index: number) => {
    if (index >= 0 && index < courses.length) {
      setCurrentIndex(index);
    }
  }, [courses.length]);

  // Toggle view mode and preserve position
  const toggleViewMode = useCallback((newMode: 'fullscreen' | 'list') => {
    if (newMode === 'list' && viewMode === 'fullscreen') {
      // Switching to list view - scroll to current course
      setViewMode(newMode);
      setTimeout(() => {
        if (listRef.current) {
          const courseElements = listRef.current.querySelectorAll('[data-course-index]');
          const targetElement = courseElements[currentIndex] as HTMLElement;
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 50);
    } else if (newMode === 'fullscreen' && viewMode === 'list') {
      // Switching back to fullscreen - current index is already preserved
      setViewMode(newMode);
    }
  }, [viewMode, currentIndex]);

  // Handle course click in list view - navigate to course detail page
  const handleCourseClick = useCallback((courseId: string) => {
    navigate(`/courses/${courseId}`);
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToNext, goToPrevious]);

  // Touch/swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedUp: goToNext,
    onSwipedDown: goToPrevious,
    trackMouse: true,
  });

  // Wheel handler for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  }, [goToNext, goToPrevious]);

  // Simplified synchronization - no preloading delays
  useEffect(() => {
    setDisplayedIndex(currentIndex);
  }, [currentIndex]);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setDisplayedIndex(0);
    }
  }, [isOpen]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentCourse = courses[currentIndex];
  const displayedCourse = courses[displayedIndex];

  // Fetch videos for the current course (only in fullscreen mode)
  const { data: courseVideos = [] } = useCourseVideos(
    currentCourse?.id, 
    isOpen && viewMode === 'fullscreen' && !!currentCourse
  );

  if (!isOpen) return null;

  // Show immediate skeleton UI instead of blank loading screen
  const showSkeletonLoading = isLoading || courses.length === 0;

  // Transform video data for the carousel
  const videos = courseVideos.map(video => ({
    videoUrl: video.media_url,
    displayName: video.displayName,
    timestamp: video.post_created_at
  }));

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full z-[9999] bg-white overflow-hidden"
      style={{ margin: 0, padding: 0, touchAction: 'none' }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onWheel={handleWheel}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onMouseMove={(e) => {
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      {...swipeHandlers}
    >
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 ${viewMode === 'list' ? '' : 'bg-gradient-to-b from-black/50 to-transparent'}`}>
        <div className="flex items-center justify-between p-4">
          <div className={viewMode === 'list' ? 'text-black' : 'text-white'}>
            <h1 className={`text-lg font-semibold ${viewMode === 'list' ? 'text-black' : 'text-white'}`}>Great Britain & Ireland Top 100</h1>
          </div>
          
          {/* Single View Toggle Icon */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleViewMode(viewMode === 'fullscreen' ? 'list' : 'fullscreen')}
              className={`${viewMode === 'list' ? 'text-black hover:text-gray-600' : 'text-white hover:text-gray-300'} transition-colors p-2`}
              aria-label={viewMode === 'fullscreen' ? 'Switch to List View' : 'Switch to Full Screen View'}
              title={viewMode === 'fullscreen' ? 'Switch to List View' : 'Switch to Full Screen View'}
            >
              {viewMode === 'fullscreen' ? (
                <CiCircleList className="h-6 w-6" />
              ) : (
                <MdFitScreen className="h-6 w-6" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className={`${viewMode === 'list' ? 'text-black hover:text-gray-600' : 'text-white hover:text-gray-300'} transition-colors p-2`}
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'fullscreen' ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {showSkeletonLoading ? (
            /* Skeleton Loading - Shows immediately */
            <div className="relative w-full h-full">
              <Skeleton className="absolute inset-0 w-full h-full" />
              
              {/* Skeleton Course Info */}
              <div className={`absolute left-0 right-0 p-6 ${
                isMobile ? 'top-1/2 -translate-y-1/2' : 'bottom-16'
              }`}>
                <Skeleton className="h-8 w-3/4 mb-3" />
                <Skeleton className="h-5 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-12 rounded-full" />
                  <Skeleton className="h-7 w-12 rounded-full" />
                </div>
              </div>
              
              {/* Skeleton Jump Points */}
              {!isMobile && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-2">
                  {[1,2,3,4,5,6,7,8,9,10,11].map((i) => (
                    <Skeleton key={i} className="h-5 w-8" />
                  ))}
                </div>
              )}
            </div>
          ) : currentCourse ? (
            <div className="relative w-full h-full">
              {/* Course Image */}
              <div className="absolute inset-0">
                {displayedCourse.thumbnail_image ? (
                  <div className="relative w-full h-full">
                    {/* Placeholder background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-6xl mb-4">⛳</div>
                        <p className="text-lg opacity-80">{displayedCourse.name}</p>
                      </div>
                    </div>
                    {/* Actual image */}
                    <img
                      src={displayedCourse.thumbnail_image}
                      alt={displayedCourse.name}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      loading="eager"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0';
                      }}
                      style={{ opacity: 0 }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-6xl mb-4">⛳</div>
                      <p className="text-lg">No image available</p>
                    </div>
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              </div>

              {/* Course Information - matching CourseCard layout exactly */}
              <div className={`absolute left-0 right-0 p-6 text-white ${
                isMobile ? 'top-1/2 -translate-y-1/2' : 'bottom-16'
              }`}>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                    {displayedCourse.name}
                  </h2>
                  <div className="text-lg opacity-90 mb-2">
                    <span>
                      {[
                        displayedCourse.country,
                        displayedCourse.sub_country,
                        displayedCourse.region
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  
                  {/* Ranking Badges - Inline version */}
                  <div className="flex gap-2">
                    {displayedCourse.regional_rank && displayedCourse.regional_rank <= 100 && (
                      <div className="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-white rounded-full">
                        <CountryFlag country="Britain & Ireland" size="lg" />
                        <span className="text-sm font-bold text-gray-800 leading-none flex items-center translate-y-[3px]">#{displayedCourse.regional_rank}</span>
                      </div>
                    )}
                    {displayedCourse.global_rank && displayedCourse.global_rank <= 100 && (
                      <div className="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-white rounded-full">
                        <Earth className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-bold text-gray-800 leading-none flex items-center translate-y-[3px]">#{displayedCourse.global_rank}</span>
                      </div>
                    )}
                    {communityRatings[displayedCourse.id] && (
                      <div className="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-white rounded-full">
                        <ClubhouseLogo size="sm" />
                        <span className="text-sm font-bold text-gray-800 leading-none flex items-center translate-y-[3px]">{communityRatings[displayedCourse.id]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Left Navigation Arrow - Previous */}
              {!isMobile && (
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-2"
                  aria-label="Previous course"
                >
                  <ChevronUp className="h-8 w-8" />
                </button>
              )}

              {/* Jump Index - Vertical on Right Side for Desktop Only */}
              {courses.length > 0 && !isMobile && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-2">
                  {[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((jumpPoint) => {
                    // Only show jump points that exist in our dataset
                    if (jumpPoint > courses.length) return null;
                    
                    const jumpIndex = jumpPoint - 1; // Convert to 0-based index
                    const currentRanking = currentIndex + 1; // Convert to 1-based ranking
                    
                    // Determine which jump point should show the dot
                    const activeJumpPoint = (() => {
                      if (currentRanking <= 9) return 1;
                      if (currentRanking <= 19) return 10;
                      if (currentRanking <= 29) return 20;
                      if (currentRanking <= 39) return 30;
                      if (currentRanking <= 49) return 40;
                      if (currentRanking <= 59) return 50;
                      if (currentRanking <= 69) return 60;
                      if (currentRanking <= 79) return 70;
                      if (currentRanking <= 89) return 80;
                      if (currentRanking <= 99) return 90;
                      return 100;
                    })();
                    
                    const showDot = jumpPoint === activeJumpPoint;

                    return (
                      <div key={jumpPoint} className="flex items-center justify-center">
                        <button
                          onClick={() => jumpToIndex(jumpIndex)}
                          className={`text-sm transition-colors ${
                            showDot 
                              ? 'text-white font-bold' 
                              : 'text-white/60 font-normal hover:text-white/80'
                          }`}
                          aria-label={`Jump to course ${jumpPoint}`}
                        >
                          {jumpPoint}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Video Overlay - Only show in fullscreen mode if videos exist */}
              {videos.length > 0 && (
                <CourseVideoOverlay
                  videos={videos}
                  courseName={currentCourse.name}
                  onOpenFullVideo={(videoIndex) => {
                    // TODO: Implement full video modal or navigate to post with specific video
                    console.log('Opening video at index:', videoIndex);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="text-black text-center">
              <p className="text-lg">No courses found</p>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="relative pt-20 pb-4 h-full overflow-y-auto" ref={listRef}>
          {isLoading ? (
            <div className="text-black text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p>Loading GB & I Top 100 courses...</p>
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="max-w-4xl mx-auto px-4 space-y-4">
                {courses.map((course, index) => (
                  <div
                    key={course.id}
                    data-course-index={index}
                    onClick={() => handleCourseClick(course.id)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                      index === currentIndex ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ minHeight: '160px' }}
                  >
                    {/* Background Image */}
                    {course.thumbnail_image ? (
                      <img
                        src={course.thumbnail_image}
                        alt={course.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
                        <span className="text-6xl">⛳</span>
                      </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Course Info Overlay */}
                    <div className="absolute inset-0 p-2 pb-3 flex flex-col justify-end text-white">
                      <div>
                        <h3 className="text-2xl font-semibold mb-1">{course.name}</h3>
                        <p className="text-lg opacity-90 mb-2">
                          {[
                            course.country,
                            course.sub_country,
                            course.region
                          ].filter(Boolean).join(', ')}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {course.regional_rank && course.regional_rank <= 100 && (
                              <div className="flex items-center gap-1 px-1 md:px-1.5 py-0.5 bg-white rounded-full">
                                <CountryFlag country="Britain & Ireland" size="md" className="md:!w-5 md:!h-5" />
                                <span className="text-xs md:text-sm font-bold text-gray-800 translate-y-[2px] md:translate-y-[3px]">#{course.regional_rank}</span>
                              </div>
                            )}
                            {course.global_rank && course.global_rank <= 100 && (
                              <div className="flex items-center gap-1 px-1 md:px-1.5 py-0.5 bg-white rounded-full">
                                <Earth className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                                <span className="text-xs md:text-sm font-bold text-gray-800 translate-y-[2px] md:translate-y-[3px]">#{course.global_rank}</span>
                              </div>
                            )}
                            {communityRatings[course.id] && (
                              <div className="flex items-center gap-1 px-1 md:px-1.5 py-0.5 bg-white rounded-full">
                                <ClubhouseLogo size="xs" className="md:!w-5 md:!h-5" />
                                <span className="text-xs md:text-sm font-bold text-gray-800 translate-y-[2px] md:translate-y-[3px]">{communityRatings[course.id]}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Add to Played Button */}
                          {user && (
                            <Button
                              onClick={(e) => handleAddToPlayed(course, e)}
                              className={`${
                                playedCourses.has(course.id)
                                  ? 'bg-[#0B6623] hover:bg-[#084C1A]'
                                  : 'bg-white hover:bg-gray-100'
                              } border-0 font-bold px-1 md:px-1.5 py-0.5 rounded-full transition-all duration-200 text-xs md:text-sm h-auto ${
                                playedCourses.has(course.id) ? 'text-white' : 'text-gray-800'
                              }`}
                            >
                              <Target className="h-4 w-4 md:h-5 md:w-5 mr-1" />
                              <span className="translate-y-[2px] md:translate-y-[3px]">{playedCourses.has(course.id) ? 'Played' : 'Add to Played'}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Number Jump List for List View */}
              <div className="fixed top-1/2 right-2 md:right-4 transform -translate-y-1/2 flex flex-col items-center gap-5 md:gap-6 z-20">
                  {[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((jumpPoint) => {
                    // Only show jump points that exist in our dataset
                    if (jumpPoint > courses.length) return null;
                    
                    const jumpIndex = jumpPoint - 1; // Convert to 0-based index
                    const currentRanking = currentIndex + 1; // Convert to 1-based ranking
                    
                    // Determine which jump point should show the dot
                    const activeJumpPoint = (() => {
                      if (currentRanking <= 9) return 1;
                      if (currentRanking <= 19) return 10;
                      if (currentRanking <= 29) return 20;
                      if (currentRanking <= 39) return 30;
                      if (currentRanking <= 49) return 40;
                      if (currentRanking <= 59) return 50;
                      if (currentRanking <= 69) return 60;
                      if (currentRanking <= 79) return 70;
                      if (currentRanking <= 89) return 80;
                      if (currentRanking <= 99) return 90;
                      return 100;
                    })();
                    
                    const showDot = jumpPoint === activeJumpPoint;

                    return (
                      <div key={jumpPoint} className="flex items-center justify-center">
                        <button
                          onClick={() => {
                            jumpToIndex(jumpIndex);
                            setCurrentIndex(jumpIndex);
                            // Scroll to the course in list view
                            setTimeout(() => {
                              if (listRef.current) {
                                const courseElements = listRef.current.querySelectorAll('[data-course-index]');
                                const targetElement = courseElements[jumpIndex] as HTMLElement;
                                if (targetElement) {
                                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }
                            }, 50);
                          }}
                          className={`text-sm transition-colors ${
                            showDot 
                              ? 'text-gray-900 font-bold' 
                              : 'text-gray-600 font-normal hover:text-gray-900'
                          }`}
                          aria-label={`Jump to course ${jumpPoint}`}
                        >
                          {jumpPoint}
                        </button>
                      </div>
                    );
                  })}
                 </div>
            
            </>
          ) : (
            <div className="text-black text-center p-8">
              <p className="text-lg">No courses found</p>
            </div>
          )}
        </div>
      )}

      {/* Add to Played Modal */}
      {selectedCourse && (
        <AddToPlayedModal
          course={selectedCourse}
          isOpen={showAddToPlayedModal}
          onClose={() => setShowAddToPlayedModal(false)}
          onSuccess={handlePlayedSuccess}
        />
      )}
    </div>
  );
};

export default GBITestModal;