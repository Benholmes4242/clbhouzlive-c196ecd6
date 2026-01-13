/**
 * MapCourseSheet - Bottom sheet for selected course on the Top 100 Map
 * Draggable between peek, half, and full states with course photo hero
 * Includes journey actions: Mark Played, Want to Play (Wishlist removed)
 */

import React, { useState, useCallback } from 'react';
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
}

type SheetState = 'peek' | 'half' | 'full';

const SHEET_HEIGHTS: Record<SheetState, string> = {
  peek: '25%',
  half: '55%',
  full: '90%',
};

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
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const sheetRef = React.useRef<HTMLDivElement>(null);

  // Reset sheet state when course changes (for seamless marker switching)
  React.useEffect(() => {
    if (course) {
      setSheetState('half');
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
      
      // If swiped down fast or far, close
      if (velocity.y > 500 || offset.y > 150) {
        onClose();
        return;
      }
      
      // If swiped up fast, expand
      if (velocity.y < -300) {
        setSheetState(sheetState === 'peek' ? 'half' : 'full');
        return;
      }
      
      // If swiped down moderately, collapse
      if (offset.y > 50) {
        setSheetState(sheetState === 'full' ? 'half' : 'peek');
        return;
      }
    },
    [onClose, sheetState]
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

  const getStatusLabel = (): { text: string; className: string } => {
    if (course?.user_has_rated) {
      return { text: '✓ Played', className: 'bg-emerald-500/90 text-white' };
    }
    if (isWantToPlay) {
      return { text: 'Want to Play', className: 'bg-[#F7931E]/90 text-white' };
    }
    return { text: 'Not Played', className: 'bg-white/90 text-slate-600 dark:bg-slate-800/90 dark:text-slate-300' };
  };

  if (!course) return null;

  const showCtAs = sheetState === 'half' || sheetState === 'full';
  const statusBadge = getStatusLabel();

  return (
    <AnimatePresence>
      {/* Backdrop - tap to dismiss */}
      <motion.div
        key="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30"
        onClick={onClose}
      />
      
      <motion.div
        ref={sheetRef}
        key={`sheet-${course.id}`}
        initial={{ y: '100%' }}
        animate={{ y: 0, height: SHEET_HEIGHTS[sheetState] }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-sheet-title"
        className={cn(
          'absolute bottom-0 left-0 right-0 z-40',
          'rounded-t-[20px]',
          'bg-white dark:bg-slate-900',
          'border-t border-slate-200/50 dark:border-slate-700/50',
          'shadow-[0_-8px_40px_rgba(0,0,0,0.15)]',
          'flex flex-col',
          'overflow-hidden'
        )}
      >
        {/* Drag handle pill */}
        <div className="flex-shrink-0 pt-2.5 pb-1.5 flex justify-center">
          <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Expand/collapse hint */}
        <button
          onClick={() => setSheetState(sheetState === 'full' ? 'half' : 'full')}
          className="absolute top-2 right-3 p-2 text-slate-400 hover:text-slate-600"
        >
          <ChevronUp
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              sheetState === 'full' && 'rotate-180'
            )}
          />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Course hero image - full width, rounded top */}
          <div className="relative w-full h-36 overflow-hidden">
            {thumbnailImage ? (
              <>
                <img
                  src={thumbnailImage}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center">
                <Flag className="h-10 w-10 text-emerald-400 dark:text-emerald-600" />
              </div>
            )}
            
            {/* Status badge overlaid on image */}
            <div className="absolute top-3 right-3">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm',
                  statusBadge.className
                )}
              >
                {statusBadge.text}
              </span>
            </div>
          </div>

          {/* Course info - below hero */}
          <div className="px-5 pt-4 pb-6">
            {/* Course name with tooltip for truncated text */}
            <h3 
              id="course-sheet-title"
              className="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2"
              title={course.name}
            >
              {course.name}
            </h3>

            {/* Location with tooltip */}
            <p 
              className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1"
              title={`${course.sub_country ? `${course.sub_country}, ` : ''}${course.country}${course.region ? ` · ${course.region}` : ''}`}
            >
              {course.sub_country && `${course.sub_country}, `}
              {course.country}
              {course.region && ` · ${course.region}`}
            </p>

            {/* Pill badges row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Rank pill */}
              {typeof course.rank === 'number' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium">
                  <Globe className="h-3 w-3" />
                  #{course.rank} {getRegionLabel(scope)}
                </span>
              )}
              
              {/* User rating pill */}
              {course.user_has_rated && course.user_rating && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs font-medium">
                  <Star className="h-3 w-3 fill-current" />
                  Your rating: {course.user_rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* CTAs - only visible when half/full */}
            {showCtAs && (
              <div className="space-y-3 mt-5">
                {/* Primary action */}
                <Button
                  className="w-full"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  View course
                </Button>
                
                {/* Journey actions - only if not played */}
                {!course.user_has_rated && user && (
                  <div className="flex gap-2">
                    {/* Mark as Played */}
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/courses/${course.id}/rate`)}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Mark Played
                    </Button>
                    
                    {/* Want to Play toggle */}
                    <Button
                      variant={isWantToPlay ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        isWantToPlay && 'bg-[#F7931E] hover:bg-[#F7931E]/90'
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
