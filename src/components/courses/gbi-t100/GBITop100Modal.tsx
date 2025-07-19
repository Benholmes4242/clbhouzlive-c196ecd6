import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import GBICarouselSlide from './GBICarouselSlide';
import GBIListView from './GBIListView';
import GBIJumpNavigation from './GBIJumpNavigation';

interface GBITop100ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GBITop100Modal: React.FC<GBITop100ModalProps> = ({ open, onOpenChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel');
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch GB&I Top 100 courses
  const { data: gbiCourses = [], isLoading } = useQuery({
    queryKey: ['gbi-top-100'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .eq('country', 'Britain & Ireland')
        .not('regional_rank', 'is', null)
        .order('regional_rank', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Reset to first course when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setViewMode('carousel');
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || viewMode !== 'carousel') return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < gbiCourses.length - 1) {
            setCurrentIndex(currentIndex + 1);
          }
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, gbiCourses.length, viewMode, onOpenChange]);

  // Handle scroll in carousel mode
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (viewMode !== 'carousel') return;

    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < gbiCourses.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Jump to specific course
  const jumpToIndex = (index: number) => {
    if (index >= 0 && index < gbiCourses.length) {
      setCurrentIndex(index);

      if (viewMode === 'carousel' && carouselRef.current) {
        const container = carouselRef.current;
        const targetScrollTop = index * container.clientHeight;
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'carousel' ? 'list' : 'carousel');
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-black border-0 rounded-none m-0" style={{ width: '100vw', height: '100vh' }}>
        <DialogTitle className="sr-only">Great Britain & Ireland Top 100 Golf Courses</DialogTitle>
        <DialogDescription className="sr-only">Browse and explore the top 100 golf courses in Great Britain and Ireland</DialogDescription>
        <div className="relative w-full h-full flex">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <h2 className="text-white text-xl font-bold">GB&I T100</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleViewMode}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {viewMode === 'carousel' ? 'List View' : 'Full Screen Modal'}
                </Button>
              </div>

              {/* Current position indicator */}
              {viewMode === 'carousel' && gbiCourses.length > 0 && (
                <div className="text-white text-sm">
                  #{gbiCourses[currentIndex]?.regional_rank || currentIndex + 1} of {gbiCourses.length}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading GB&I Top 100...</p>
                </div>
              </div>
            ) : viewMode === 'carousel' ? (
              <div
                ref={carouselRef}
                className="h-full overflow-y-auto snap-y snap-mandatory"
                onScroll={handleScroll}
                style={{ scrollBehavior: 'smooth' }}
              >
                {gbiCourses.map((course, index) => (
                  <div key={course.id} className="h-full snap-start">
                    <GBICarouselSlide
                      course={course}
                      isActive={index === currentIndex}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full pt-20">
                <GBIListView
                  courses={gbiCourses}
                  onCourseClick={(index) => {
                    setCurrentIndex(index);
                    setViewMode('carousel');
                    jumpToIndex(index);
                  }}
                />
              </div>
            )}
          </div>

          {/* Jump Navigation - only show in carousel mode */}
          {viewMode === 'carousel' && !isLoading && (
            <GBIJumpNavigation
              totalCourses={gbiCourses.length}
              currentIndex={currentIndex}
              onJumpTo={jumpToIndex}
            />
          )}

          {/* Navigation arrows for carousel mode */}
          {viewMode === 'carousel' && !isLoading && (
            <>
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 z-40 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => jumpToIndex(currentIndex - 1)}
                >
                  <ChevronUp className="h-5 w-5" />
                </Button>
              )}

              {currentIndex < gbiCourses.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => jumpToIndex(currentIndex + 1)}
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GBITop100Modal;