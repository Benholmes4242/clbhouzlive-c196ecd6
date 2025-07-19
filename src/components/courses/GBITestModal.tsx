import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import CourseRankBadges from './CourseRankBadges';

interface GBITestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  thumbnail_image?: string;
  regional_rank?: number;
  global_rank?: number;
  description?: string;
}

const GBITestModal: React.FC<GBITestModalProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

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

  if (!isOpen) return null;

  const currentCourse = courses[currentIndex];

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full z-[9999] bg-black overflow-hidden"
      style={{ margin: 0, padding: 0 }}
      {...swipeHandlers}
      onWheel={handleWheel}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="text-white">
            <h1 className="text-lg font-semibold">GB & I Top 100 Test</h1>
            <p className="text-sm opacity-80">
              {courses.length > 0 && `${currentIndex + 1} of ${courses.length}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-2"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isLoading ? (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
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
            <div className="absolute bottom-8 left-0 right-0 p-6 text-white">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                  {currentCourse.name}
                </h2>
                <div className="flex items-center gap-2 text-lg opacity-90">
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  <span>
                    {currentCourse.country}
                    {currentCourse.region && currentCourse.region !== currentCourse.country 
                      ? `, ${currentCourse.region}` 
                      : ''
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Ranking Badges - using CourseRankBadges component positioned bottom-left */}
            <CourseRankBadges
              globalRank={currentCourse.global_rank}
              regionalRank={currentCourse.regional_rank}
              usaRank={null}
              country={currentCourse.country}
              viewContext="regional"
              positioning="bottom-left"
            />

            {/* Navigation Arrows */}
            {!isMobile && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-2"
                  aria-label="Previous course"
                >
                  <ChevronUp className="h-8 w-8" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex === courses.length - 1}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-2"
                  aria-label="Next course"
                >
                  <ChevronDown className="h-8 w-8" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="text-white text-center">
            <p className="text-lg">No courses found</p>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {courses.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/50 rounded-full px-4 py-2 text-white text-sm">
            {currentIndex + 1} / {courses.length}
          </div>
        </div>
      )}

    </div>
  );
};

export default GBITestModal;