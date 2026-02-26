/**
 * MapCourseSheet - Dark glass bottom sheet for selected course on the Top 100 Map
 */

import React, { useState, useCallback } from 'react';
import '@/styles/hero-glass.css';
import { useNavigate } from 'react-router-dom';
import { Globe, Star, Bookmark, Flag, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (course) {
      setImageLoaded(false);
    }
  }, [course?.id]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && course) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [course, onClose]);

  const { data: thumbnailImage } = useCourseImage(course?.id);
  const { data: shortlistStatus } = useCourseShortlistStatus(course?.id, user?.id);

  const isWantToPlay = shortlistStatus?.list_key === 'want_to_play' || shortlistStatus?.list_key === 'wishlist';

  const toggleWantToPlayMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !course?.id) throw new Error('Not authenticated');
      
      if (isWantToPlay) {
        await supabase.from('course_shortlists').delete()
          .eq('course_id', course.id)
          .eq('user_id', user.id);
      } else {
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
      if (velocity.y > 400 || offset.y > 80) {
        onClose();
        return;
      }
    },
    [onClose]
  );

  const getRegionLabel = (scopeKey: string): string => {
    const labels: Record<string, string> = {
      global: 'Global', 'gb-i': 'GB&I', usa: 'USA', europe: 'Europe',
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
      className: 'bg-white/20 text-white/80 backdrop-blur-md' 
    };
  };

  if (!course) return null;

  const statusBadge = getStatusLabel();

  return (
    <AnimatePresence mode="wait">
      {/* Invisible backdrop */}
      <motion.div
        key="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dark glass sheet — sits at bottom: 0 */}
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
        className="glass-card fixed left-0 right-0 bottom-0 z-50 flex flex-col !rounded-b-none !overflow-visible"
        style={{ 
          borderRadius: '24px 24px 0 0',
          borderBottom: 'none',
          position: 'fixed',
        }}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center cursor-grab active:cursor-grabbing" style={{ margin: '12px auto 8px' }}>
          <div className="rounded-full" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.25)' }} />
        </div>

        <div className="flex-shrink-0">
          {/* Course hero image with gradient fade */}
          <div className="relative w-full h-40 flex-shrink-0 overflow-hidden">
            {thumbnailImage ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
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
                {/* Gradient fade from image into dark glass */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-16"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.7))'
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                <Flag className="h-12 w-12 text-white/30" />
              </div>
            )}
            
            {/* Status badge over image */}
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

          {/* Course info */}
          <div className="px-5 pt-3 pb-0">
            <h3 
              id="course-sheet-title"
              className="text-xl font-bold text-white leading-tight line-clamp-2"
              title={course.name}
            >
              {course.name}
            </h3>

            <p 
              className="text-sm mt-1.5 line-clamp-1"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              title={`${course.sub_country ? `${course.sub_country}, ` : ''}${course.country}${course.region ? ` · ${course.region}` : ''}`}
            >
              {course.sub_country && `${course.sub_country}, `}
              {course.country}
              {course.region && ` · ${course.region}`}
            </p>

            {/* Unified dark chip badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {typeof course.rank === 'number' && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <Globe className="h-3.5 w-3.5" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    #{course.rank} {getRegionLabel(scope)}
                  </span>
                </div>
              )}
              
              {course.user_has_rated && course.user_rating && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Your rating: {course.user_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="space-y-3 mt-6">
              <button
                className="w-full py-3.5 rounded-xl text-[15px] font-semibold active:scale-[0.98] active:opacity-90 transition-all duration-150"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#1a1a1a',
                }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                View course
              </button>
              
              {!course.user_has_rated && user && (
                <div className="flex gap-2.5">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all duration-150"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'rgba(255, 255, 255, 0.85)',
                    }}
                    onClick={() => navigate(`/courses/${course.id}/rate`)}
                  >
                    <Check className="h-4 w-4" />
                    Mark Played
                  </button>
                  
                  <button
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all duration-150",
                    )}
                    style={isWantToPlay ? {
                      background: '#F7931E',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(247,147,30,0.25)',
                    } : {
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'rgba(255, 255, 255, 0.85)',
                    }}
                    onClick={() => toggleWantToPlayMutation.mutate()}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className={cn('h-4 w-4', isWantToPlay && 'fill-current')} />
                    )}
                    {isWantToPlay ? '✓ Want to Play' : 'Want to Play'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom safe area */}
        <div style={{ paddingBottom: 'calc(max(16px, env(safe-area-inset-bottom, 0px)))' }} />
      </motion.div>
    </AnimatePresence>
  );
};

export default MapCourseSheet;
