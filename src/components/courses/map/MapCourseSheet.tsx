/**
 * MapCourseSheet - Bottom sheet for selected course on the Top 100 Map
 * Draggable between peek, half, and full states with course photo hero
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Star, Bookmark, ChevronUp, Flag } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Top100MapCourse } from '@/hooks/useTop100MapCourses';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

export const MapCourseSheet: React.FC<MapCourseSheetProps> = ({
  course,
  onClose,
  scope,
}) => {
  const navigate = useNavigate();
  const [sheetState, setSheetState] = useState<SheetState>('half');
  
  const { data: thumbnailImage } = useCourseImage(course?.id);

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

  if (!course) return null;

  const showCtAs = sheetState === 'half' || sheetState === 'full';

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
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0, height: SHEET_HEIGHTS[sheetState] }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
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
                  course.user_has_rated
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-white/90 text-slate-600 dark:bg-slate-800/90 dark:text-slate-300'
                )}
              >
                {course.user_has_rated ? '✓ Played' : 'Not Played'}
              </span>
            </div>
          </div>

          {/* Course info - below hero */}
          <div className="px-5 pt-4 pb-6">
            {/* Course name */}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {course.name}
            </h3>

            {/* Location */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
              
              {/* Played status pill - compact version */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                  course.user_has_rated
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {course.user_has_rated ? '✓ Played' : '○ Not played'}
              </span>
            </div>

            {/* CTAs - only visible when half/full */}
            {showCtAs && (
              <div className="flex gap-3 mt-5">
                <Button
                  className="flex-1"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  View course
                </Button>
                
                {!course.user_has_rated && (
                  <Button
                    variant="outline"
                    className="flex-shrink-0"
                    onClick={() => {
                      // TODO: Add to wishlist functionality
                      console.log('Add to wishlist:', course.id);
                    }}
                  >
                    <Bookmark className="h-4 w-4 mr-1.5" />
                    Wishlist
                  </Button>
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
