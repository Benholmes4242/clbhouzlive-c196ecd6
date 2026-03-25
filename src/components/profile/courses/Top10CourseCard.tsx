/**
 * Top10CourseCard - Apple-style premium card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Full-bleed hero image with gradient overlay
 * - Frosted glass rank badge (top left)
 * - Frosted glass rating chip (bottom)
 * - Frosted glass reaction strip overlay
 * - 280x360px taller aspect ratio
 * - 24px rounded corners
 * - Layered shadow with press state
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { getScoreTier } from '@/utils/getScoreTier';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTopTenReactions, REACTION_CONFIG, ReactionType } from '@/hooks/useTopTenReactions';
import { TopTenCardComments } from './TopTenCardComments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface Top10CourseCardProps {
  course: TopTenCourse;
  position: number;
  rating?: number;
  className?: string;
  isOwnProfile?: boolean;
  userId?: string;
  privacySetting?: string;
}

export const Top10CourseCard: React.FC<Top10CourseCardProps> = ({
  course,
  position,
  rating,
  className,
  isOwnProfile = true,
  userId,
  privacySetting,
}) => {
  const navigate = useNavigate();
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  const { user } = useSupabaseSession();
  const targetUserId = userId ?? '';
  const { counts, myReaction, toggleReaction } = useTopTenReactions(targetUserId, course.course_id);
  
  // Fetch the review text for the bottom sheet
  const { data: reviewData } = useQuery({
    queryKey: ['course-rating-review', course.course_id, userId],
    enabled: !!userId && !!course.course_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('id, review')
        .eq('course_id', course.course_id)
        .eq('user_id', userId!)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
  
  const handleCardClick = () => {
    setCommentsOpen(true);
  };
  
  const handleCloseReviewSheet = useCallback(() => {
    setIsReviewSheetOpen(false);
  }, []);
  
  const handleViewCourse = useCallback(() => {
    handleCloseReviewSheet();
    navigate(`/courses/${course.course_id}`);
  }, [course.course_id, navigate, handleCloseReviewSheet]);
  
  const handleReadFullReview = useCallback(() => {
    handleCloseReviewSheet();
    if (reviewData?.id) {
      navigate(`/courses/${course.course_id}?tab=reviews&review=${reviewData.id}`);
    } else {
      navigate(`/courses/${course.course_id}?tab=reviews`);
    }
  }, [course.course_id, reviewData?.id, navigate, handleCloseReviewSheet]);
  
  // Get tier info for rating display
  const tierData = rating !== undefined ? getScoreTier(rating) : null;
  
  // Location subtitle
  const heroSubtitle = course.sub_country || course.country;

  return (
    <>
      <motion.div
        onClick={handleCardClick}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative w-[227px] h-[292px] rounded-[22px] overflow-hidden flex-shrink-0 cursor-pointer",
          className
        )}
        style={{}}
      >
        {/* Background image - full bleed */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white/40" />
          </div>
        )}

        {/* Gradient overlay for text legibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Rank badge - frosted glass style (top left) */}
        <div 
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span className="text-white font-semibold text-sm">#{position}</span>
        </div>

        {/* Content overlay - bottom (above reaction strip) */}
        <div className="absolute bottom-[40px] left-0 right-0 p-5 pb-2">
          {/* Course name */}
          <h3 
            className="text-white font-semibold text-lg leading-tight mb-1 line-clamp-2"
            style={{
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}
          >
            {course.name}
          </h3>
          
          {/* Location */}
          <p 
            className="text-white/70 text-sm mb-3"
            style={{
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {heroSubtitle}
          </p>
          
          {/* Rating chip - frosted glass */}
          {rating !== undefined && tierData && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(245, 158, 11, 0.15)',
              }}
            >
              <span 
                className="font-bold text-lg"
                style={{ color: '#f59e0b' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              <span 
                className="text-xs font-medium tracking-wide uppercase"
                style={{ color: 'rgba(245, 158, 11, 0.75)' }}
              >
                {tierData.label}
              </span>
            </div>
          )}
        </div>

        {/* Reaction strip — overlaid at bottom of card image */}
        <div
          className="absolute bottom-0 left-0 right-0 flex"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([type, config], idx) => {
            const count = counts[type] ?? 0;
            const isActive = myReaction === type;
            const isLast = idx === Object.keys(REACTION_CONFIG).length - 1;
            return (
              <button
                key={type}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOwnProfile) toggleReaction(type);
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5
                  transition-all active:scale-95
                  ${isActive ? 'bg-amber-500/25' : 'bg-black/45'}
                  ${!isLast ? 'border-r border-white/[0.08]' : ''}
                  ${isOwnProfile ? 'cursor-default' : 'cursor-pointer'}
                `}
                style={{ backdropFilter: 'blur(12px)' }}
                disabled={isOwnProfile}
              >
                <span className="text-sm">{config.emoji}</span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-amber-400' : 'text-white/60'}`}>
                  {count > 0 ? count : '·'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtle tap indicator - bottom right */}
        <div className="absolute bottom-[44px] right-5">
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
      </motion.div>
      
      {/* Comments sheet */}
      <TopTenCardComments
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        targetUserId={targetUserId}
        courseId={course.course_id}
        courseName={course.name}
        isOwnProfile={isOwnProfile ?? true}
        privacySetting={privacySetting ?? 'followers'}
      />

      {/* Review Bottom Sheet - Liquid Glass with swipe-to-dismiss */}
      <BottomSheet 
        open={isReviewSheetOpen} 
        onClose={handleCloseReviewSheet}
        className="h-[70vh]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(50px) saturate(180%)',
          WebkitBackdropFilter: 'blur(50px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,0.2)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <div className="flex flex-col h-full px-6 pb-6 overflow-hidden">
          {/* Header: Course info */}
          <div className="flex flex-col gap-1 mb-5 pt-2">
            <h2 className="text-xl font-semibold text-white truncate">{course.name}</h2>
            {heroSubtitle && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                <span className="text-sm text-white/50 truncate">{heroSubtitle}</span>
              </div>
            )}
          </div>

          {/* Rating - large centered number with dynamic color */}
          {rating !== undefined && tierData && (
            <div className="flex flex-col items-center justify-center mb-4">
              <span 
                className="text-5xl font-bold"
                style={{ color: '#f59e0b' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              <span 
                className="text-sm font-semibold uppercase tracking-wider mt-1"
                style={{ color: 'rgba(245, 158, 11, 0.75)' }}
              >
                {tierData.label}
              </span>
            </div>
          )}

          {/* Review Text - Scrollable with glass card and fade effect */}
          {reviewData?.review && (
            <div 
              className="flex-1 min-h-0 mb-4 overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
              }}
            >
              <ScrollArea className="h-full">
                <div 
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(0,0,0,0.15)',
                    border: '0.5px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">
                    "{reviewData.review}"
                  </p>
                </div>
                {/* Bottom spacer so text can scroll above the fade */}
                <div className="h-8" />
              </ScrollArea>
            </div>
          )}
          
          {/* No review text placeholder */}
          {!reviewData?.review && (
            <div className="flex-1 min-h-0 mb-4 flex items-center justify-center">
              <p className="text-white/40 text-sm italic">No written review</p>
            </div>
          )}

          {/* CTAs - Glass style buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleViewCourse}
              className="flex-1 py-3.5 rounded-xl font-medium text-sm text-white/80 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '0.5px solid rgba(255,255,255,0.15)',
              }}
            >
              View Course
            </button>
            <button
              onClick={handleReadFullReview}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                boxShadow: '0 4px 14px rgba(251,191,36,0.25)',
                color: '#000',
              }}
            >
              Read Full Review
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
