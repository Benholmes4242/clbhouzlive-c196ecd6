import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronUp, ChevronDown, MapPin, Earth, Target } from 'lucide-react';
import { CiCircleList } from 'react-icons/ci';
import { MdFitScreen } from 'react-icons/md';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CountryFlag from '@/components/ui/country-flag';
import CourseRankBadges from './CourseRankBadges';
import CourseVideoOverlay from './CourseVideoOverlay';
import AddToPlayedModal from './AddToPlayedModal';
import { useCourseVideos } from '@/hooks/useCourseVideos';
import { Button } from '@/components/ui/button';

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
  const [viewMode, setViewMode] = useState<'fullscreen' | 'list'>('fullscreen');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAddToPlayedModal, setShowAddToPlayedModal] = useState(false);
  const [playedCourses, setPlayedCourses] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();

  // Fetch GB & I Top 100 courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['gbi-top-100-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .eq('country', 'Britain & Ireland')
        .not('regional_rank', 'is', null)
        .lte('regional_rank', 100)
        .order('regional_rank', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Query to get user's played courses
  const { data: userPlayedCourses = [] } = useQuery({
    queryKey: ['userTop100CoursesGBI', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_top100_courses')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('played', true);

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!user?.id,
  });

  // Update played courses set when data changes
  useEffect(() => {
    const playedSet = new Set(userPlayedCourses.map(pc => pc.course_id));
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

  // Handle course click in list view
  const handleCourseClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setViewMode('fullscreen');
  }, []);

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

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
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

  // Fetch videos for the current course (only in fullscreen mode)
  const { data: courseVideos = [] } = useCourseVideos(
    currentCourse?.id, 
    isOpen && viewMode === 'fullscreen' && !!currentCourse
  );

  if (!isOpen) return null;

  const latestVideo = courseVideos.length > 0 ? courseVideos[0] : null;

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
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white/90 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="text-black">
            <h1 className="text-lg opacity-90">Great Britain & Ireland Top 100</h1>
          </div>
          
          {/* Single View Toggle Icon */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleViewMode(viewMode === 'fullscreen' ? 'list' : 'fullscreen')}
              className="text-black hover:text-gray-600 transition-colors p-2"
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
              className="text-black hover:text-gray-600 transition-colors p-2"
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
          {isLoading ? (
            <div className="text-black text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p>Loading GB & I Top 100 courses...</p>
            </div>
          ) : currentCourse ? (
            <div className="relative w-full h-full">
              {/* Course Image */}
              <div className="absolute inset-0">
                {currentCourse.thumbnail_image ? (
                  <img
                    src={currentCourse.thumbnail_image}
                    alt={currentCourse.name}
                    className="w-full h-full object-cover"
                  />
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
                isMobile ? 'bottom-4' : 'bottom-16'
              }`}>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                    {currentCourse.name}
                  </h2>
                  <div className="text-lg opacity-90 mb-2">
                    <span>
                      {[
                        currentCourse.country,
                        currentCourse.sub_country,
                        currentCourse.region
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  
                  {/* Ranking Badges - Inline version */}
                  <div className="flex gap-2">
                    {currentCourse.global_rank && currentCourse.global_rank <= 100 && (
                      <div className="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-white rounded-full">
                        <Earth className="h-4 w-4 text-gray-600" />
                        <span className="text-xs font-bold text-gray-800 leading-none flex items-center translate-y-[1px]">#{currentCourse.global_rank}</span>
                      </div>
                    )}
                    {currentCourse.regional_rank && currentCourse.regional_rank <= 100 && (
                      <div className="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-white rounded-full">
                        <CountryFlag country="Britain & Ireland" size="md" />
                        <span className="text-xs font-bold text-gray-800 leading-none flex items-center translate-y-[1px]">#{currentCourse.regional_rank}</span>
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

              {/* Jump Index - Vertical on Right Side for Both Desktop and Mobile */}
              {courses.length > 0 && (
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

              {/* Video Overlay - Only show in fullscreen mode if video exists */}
              {latestVideo && (
                <CourseVideoOverlay
                  videoUrl={latestVideo.media_url}
                  courseName={currentCourse.name}
                  onOpenFullVideo={() => {
                    // TODO: Implement full video modal or navigate to post
                    console.log('Open full video for post:', latestVideo.post_id);
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
        <div className="pt-20 pb-4 h-full overflow-y-auto" ref={listRef}>
          {isLoading ? (
            <div className="text-black text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p>Loading GB & I Top 100 courses...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="max-w-4xl mx-auto px-4 space-y-4">
              {courses.map((course, index) => (
                <div
                  key={course.id}
                  data-course-index={index}
                  onClick={() => handleCourseClick(index)}
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
                  <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                    <div className="mb-4">
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
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-full">
                              <CountryFlag country="Britain & Ireland" size="md" />
                              <span className="text-xs font-bold text-gray-800 translate-y-[1px]">#{course.regional_rank}</span>
                            </div>
                          )}
                          {course.global_rank && course.global_rank <= 100 && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-full">
                              <Earth className="h-4 w-4 text-gray-600" />
                              <span className="text-xs font-bold text-gray-800 translate-y-[1px]">#{course.global_rank}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Add to Played Button */}
                        {user && (
                          <Button
                            onClick={(e) => handleAddToPlayed(course, e)}
                            className={`${
                              playedCourses.has(course.id)
                                ? 'bg-[#9DC183] hover:bg-[#8AB372]'
                                : 'bg-white hover:bg-gray-100'
                            } border-0 font-bold px-1.5 py-0.5 rounded-full transition-all duration-200 text-xs ${
                              playedCourses.has(course.id) ? 'text-white' : 'text-gray-800'
                            }`}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            {playedCourses.has(course.id) ? 'Played' : 'Add to Played'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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