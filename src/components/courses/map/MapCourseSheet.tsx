/**
 * MapCourseSheet - World-class bottom sheet for selected course on the Top 100 Map
 * Draggable between peek, half, and full states with course photo hero
 * Features premium liquid glass aesthetic, smooth spring animations, and journey actions
 */

import React, { useState, useCallback } from 'react';
import '@/styles/hero-glass.css';
import { useNavigate } from 'react-router-dom';
import { Globe, Star, Bookmark, ChevronUp, Flag, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Top100MapCourse } from '@/hooks/useTop100MapCourses';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

interface MapCourseSheetProps {
  course: Top100MapCourse | null;
  onClose: () => void;
  scope: string;
  /** Height of the filter tray in pixels - sheet positions above this */
  filterTrayHeight?: number;
}

type SheetState = 'peek' | 'half' | 'full';

// Filter tray height constant (matches the fixed filter tray)
const DEFAULT_FILTER_TRAY_HEIGHT = 120;

// Fetch course thumbnail image
const useCourseImage = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-thumbnail', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data } = await supabase
        .from('golf_courses')
        .select('thumbnail_image')
        .eq('id', courseId)
        .single();
      return data?.thumbnail_image || null;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for course shortlist status
const useCourseShortlistStatus = (courseId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['course-shortlist-status', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) return null;
      const { data } = await supabase
        .from('course_shortlists')
        .select('id, list_key')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!courseId && !!userId,
    staleTime: 30_000,
  });
};

export const MapCourseSheet: React.FC<MapCourseSheetProps> = ({
  course,
  onClose,
  scope,
  filterTrayHeight = DEFAULT_FILTER_TRAY_HEIGHT,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [imageLoaded, setImageLoaded] = useState(false);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  // Reset sheet state when course changes (for seamless marker switching)
  React.useEffect(() => {
    if (course) {
      setSheetState('half');
      setImageLoaded(false);
    }
  }, [course?.id]);

  // Keyboard handler for Escape to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && course) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [course, onClose]);

  // Focus management when sheet opens
  React.useEffect(() => {
    if (course && sheetRef.current) {
      const firstButton = sheetRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [course?.id]);
  
  const { data: thumbnailImage } = useCourseImage(course?.id);
  const { data: shortlistStatus } = useCourseShortlistStatus(course?.id, user?.id);

  // Treat both want_to_play and legacy wishlist as want_to_play
  const isWantToPlay = shortlistStatus?.list_key === 'want_to_play' || shortlistStatus?.list_key === 'wishlist';

  // Mutation to toggle want to play
  const toggleWantToPlayMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !course?.id) throw new Error('Not authenticated');
      
      if (isWantToPlay) {
        await supabase.from('course_shortlists').delete()
          .eq('course_id', course.id)
          .eq('user_id', user.id);
      } else {
        // Remove any existing first
        await supabase.from('course_shortlists').delete()
          .eq('course_id', course.id)
          .eq('user_id', user.id);
        await supabase.from('course_shortlists').insert({
          course_id: course.id,
          user_id: user.id,
          list_key: 'want_to_play',
        });
      }
    },
    onSuccess: () => {
      toast.success(isWantToPlay ? 'Removed from Want to Play' : 'Added to Want to Play');
      // Use predicate to match all query variations
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'course-shortlist-status' 
      });
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'top100-map-courses' 
      });
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'user-journey-courses' 
      });
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'course-personal-status' 
      });
    },
    onError: () => toast.error('Failed to update'),
  });

  const isUpdating = toggleWantToPlayMutation.isPending;

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const { velocity, offset } = info;
      
      // If swiped down fast or far, close the sheet
      if (velocity.y > 400 || offset.y > 80) {
        onClose();
        return;
      }
      
      // Otherwise snap back (no state changes since we only have one state now)
    },
    [onClose]
  );

  const getRegionLabel = (scopeKey: string): string => {
    const labels: Record<string, string> = {
      global: 'Global',
      'gb-i': 'GB&I',
      usa: 'USA',
      europe: 'Europe',
    };
    return labels[scopeKey] || 'Global';
  };

  const getStatusLabel = (): { text: string; className: string; icon?: React.ReactNode } => {
    if (course?.user_has_rated) {
      return { 
        text: 'Played', 
        className: 'bg-emerald-500/95 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]',
        icon: <Check className="h-3 w-3 mr-1" />
      };
    }
    if (isWantToPlay) {
      return { 
        text: 'Want to Play', 
        className: 'bg-[#F7931E]/95 text-white shadow-[0_2px_8px_rgba(247,147,30,0.3)]',
        icon: <Bookmark className="h-3 w-3 mr-1 fill-current" />
      };
    }
    return { 
      text: 'Not Played', 
      className: 'bg-white/95 text-muted-foreground dark:bg-muted/95 dark:text-muted-foreground shadow-sm' 
    };
  };

  if (!course) return null;

  const showCtAs = sheetState === 'half' || sheetState === 'full';
  const statusBadge = getStatusLabel();

  return (
    <AnimatePresence mode="wait">
      {/* Invisible backdrop - tap to dismiss */}
      <motion.div
        key="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Sheet - fixed, positioned above filter tray */}
      <motion.div
        ref={sheetRef}
        key={`sheet-${course.id}`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ 
          type: 'spring', 
          damping: 32, 
          stiffness: 400,
          mass: 0.8
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-sheet-title"
        className="fixed left-0 right-0 z-50 flex flex-col rounded-t-3xl"
        style={{ 
          bottom: filterTrayHeight,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0.10) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderBottom: 'none',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
        }}
      >
        {/* Drag handle pill - visual affordance for swiping */}
        <div className="flex-shrink-0 pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-white/40" />
        </div>

        {/* Expand/collapse hint button */}
        <button
          onClick={() => setSheetState(sheetState === 'full' ? 'half' : 'full')}
          className={cn(
            'absolute top-2.5 right-3 p-2.5 rounded-full',
            'text-white/60 hover:text-white/90',
            'hover:bg-white/10',
            'active:scale-[0.95] transition-all duration-150'
          )}
          aria-label={sheetState === 'full' ? 'Collapse sheet' : 'Expand sheet'}
        >
          <ChevronUp
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              sheetState === 'full' && 'rotate-180'
            )}
          />
        </button>

        {/* Content - no scroll, auto height */}
        <div className="flex-shrink-0">
          {/* Course hero image - optimized height for all content to fit in half state */}
          <div className="relative w-full h-36 flex-shrink-0 overflow-hidden">
            {thumbnailImage ? (
              <>
                {/* Blur-up placeholder */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/80 dark:from-muted dark:to-muted/80 animate-pulse" />
                )}
                <img
                  src={thumbnailImage}
                  alt={course.name}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-300',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center">
                <Flag className="h-12 w-12 text-emerald-400 dark:text-emerald-600 opacity-60" />
              </div>
            )}
            
            {/* Status badge overlaid on image - premium pill */}
            <div className="absolute top-3 right-3">
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full',
                  'text-[11px] font-semibold backdrop-blur-md',
                  statusBadge.className
                )}
              >
                {statusBadge.icon}
                {statusBadge.text}
              </span>
            </div>
          </div>

          {/* Course info - below hero with refined spacing */}
          <div className="px-5 pt-4 pb-6">
            {/* Course name with tooltip for truncated text */}
            <h3 
              id="course-sheet-title"
              className="text-xl font-bold text-white leading-tight line-clamp-2"
              title={course.name}
            >
              {course.name}
            </h3>

            {/* Location with tooltip */}
            <p 
              className="text-sm text-white/60 mt-1.5 line-clamp-1"
              title={`${course.sub_country ? `${course.sub_country}, ` : ''}${course.country}${course.region ? ` · ${course.region}` : ''}`}
            >
              {course.sub_country && `${course.sub_country}, `}
              {course.country}
              {course.region && ` · ${course.region}`}
            </p>

            {/* Pill badges row - glass styling */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* Rank pill with icon - glass background */}
              {typeof course.rank === 'number' && (
                <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/90">
                  <Globe className="h-3.5 w-3.5" />
                  #{course.rank} {getRegionLabel(scope)}
                </span>
              )}
              
              {/* User rating pill - amber accent on glass */}
              {course.user_has_rated && course.user_rating && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/30 backdrop-blur-md text-xs font-semibold text-amber-200 border border-amber-400/30">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Your rating: {course.user_rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* CTAs - only visible when half/full - glass button styling */}
            {showCtAs && (
              <div className="space-y-3 mt-6">
                {/* Primary action - View course - bright white for visibility */}
                <Button
                  className={cn(
                    'w-full h-11',
                    'bg-white/95 hover:bg-white',
                    'text-foreground',
                    'font-medium shadow-lg',
                    'active:scale-[0.98] transition-all duration-150'
                  )}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  View course
                </Button>
                
                {/* Journey actions - only if not played */}
                {!course.user_has_rated && user && (
                  <div className="flex gap-2.5">
                    {/* Mark as Played */}
                    <Button
                      variant="outline"
                      className={cn(
                        'flex-1 h-11',
                        'border-white/30 bg-white/10 text-white',
                        'hover:bg-white/20 hover:border-white/40',
                        'active:scale-[0.98] transition-all duration-150'
                      )}
                      onClick={() => navigate(`/courses/${course.id}/rate`)}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Mark Played
                    </Button>
                    
                    {/* Want to Play toggle */}
                    <Button
                      variant={isWantToPlay ? 'default' : 'outline'}
                      className={cn(
                        "flex-1 h-11 transition-all duration-200",
                        isWantToPlay 
                          ? 'bg-[#F7931E] hover:bg-[#F7931E]/90 text-white shadow-[0_2px_8px_rgba(247,147,30,0.25)]' 
                          : 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/40',
                        'active:scale-[0.98]'
                      )}
                      onClick={() => toggleWantToPlayMutation.mutate()}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <Bookmark className={cn('h-4 w-4 mr-1.5', isWantToPlay && 'fill-current')} />
                      )}
                      {isWantToPlay ? '✓ Want to Play' : 'Want to Play'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapCourseSheet;
