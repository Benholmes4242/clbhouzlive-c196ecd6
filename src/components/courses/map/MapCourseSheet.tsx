/**
 * MapCourseSheet - Bottom sheet for selected course on the Top 100 Map
 * Draggable between peek, half, and near-full states
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Globe, Star, Bookmark, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Top100MapCourse } from '@/hooks/useTop100MapCourses';

interface MapCourseSheetProps {
  course: Top100MapCourse | null;
  onClose: () => void;
  scope: string;
}

type SheetState = 'peek' | 'half' | 'full';

const SHEET_HEIGHTS: Record<SheetState, string> = {
  peek: '180px',
  half: '45%',
  full: '85%',
};

export const MapCourseSheet: React.FC<MapCourseSheetProps> = ({
  course,
  onClose,
  scope,
}) => {
  const navigate = useNavigate();
  const [sheetState, setSheetState] = useState<SheetState>('half');

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

  return (
    <AnimatePresence>
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
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute bottom-0 left-0 right-0 z-40',
          'rounded-t-3xl',
          'bg-white/95 dark:bg-slate-900/95',
          'backdrop-blur-xl',
          'border-t border-white/30 dark:border-slate-700/50',
          'shadow-[0_-8px_40px_rgba(0,0,0,0.2)]',
          'flex flex-col',
          'overflow-hidden'
        )}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Expand/collapse hint */}
        <button
          onClick={() => setSheetState(sheetState === 'full' ? 'half' : 'full')}
          className="absolute top-2 right-12 p-2 text-slate-400 hover:text-slate-600"
        >
          <ChevronUp
            className={cn(
              'h-4 w-4 transition-transform',
              sheetState === 'full' && 'rotate-180'
            )}
          />
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Course hero image placeholder - could use thumbnail */}
          <div className="relative h-28 rounded-sq-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            {/* Status badge */}
            <div className="absolute top-2 right-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold',
                  course.user_has_rated
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {course.user_has_rated ? '✓ Played' : 'Not Played'}
              </span>
            </div>
          </div>

          {/* Course name */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
            {course.name}
          </h3>

          {/* Location */}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {course.sub_country && `${course.sub_country}, `}
            {course.country}
            {course.region && ` · ${course.region}`}
          </p>

          {/* Rank badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {typeof course.rank === 'number' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium">
                <Globe className="h-3 w-3" />
                #{course.rank} {getRegionLabel(scope)}
              </span>
            )}
            
            {course.user_has_rated && course.user_rating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs font-medium">
                <Star className="h-3 w-3 fill-current" />
                Your rating: {course.user_rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* CTAs */}
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapCourseSheet;
