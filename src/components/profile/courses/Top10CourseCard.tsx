/**
 * Top10CourseCard - Crown jewel card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Ranking badge (medal style) on top left
 * - Rating capsule (top right) matching review post overlay style
 * - Overall rating bar below image
 * - "Full review" CTA that opens review bottom sheet
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

interface Top10CourseCardProps {
  course: TopTenCourse;
  position: number;
  rating?: number;
  className?: string;
  isOwnProfile?: boolean;
  userId?: string;
}

 // Medal colors for ranking badges - #1 uses Chartreus gold
const getRankingBadgeStyle = (position: number): { 
  bg: string; 
  text: string; 
  shadow?: string;
  size: string;
} => {
  switch (position) {
    case 1:
       // Amber/Gold for #1
      return { 
         bg: '#f59e0b', 
        text: '#FFFFFF',
         shadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
        size: 'w-8 h-8 text-sm',
      };
    case 2:
      // Silver
      return { 
        bg: 'linear-gradient(145deg, #94A3B8 0%, #64748B 100%)', 
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(100, 116, 139, 0.35)',
        size: 'w-7 h-7 text-sm',
      };
    case 3:
      // Bronze
      return { 
        bg: 'linear-gradient(145deg, #D97706 0%, #B45309 100%)', 
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(217, 119, 6, 0.35)',
        size: 'w-7 h-7 text-sm',
      };
    default:
      // Slate grey
      return { 
        bg: '#F1F5F9', 
        text: '#475569',
        shadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
        size: 'w-6 h-6 text-xs',
      };
  }
};

export const Top10CourseCard: React.FC<Top10CourseCardProps> = ({
  course,
  position,
  rating,
  className,
  isOwnProfile = true,
  userId,
}) => {
  const navigate = useNavigate();
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  
  // Fetch the review text for the bottom sheet
  const { data: reviewData } = useQuery({
    queryKey: ['course-rating-review', course.course_id, userId],
    enabled: !!userId && !!course.course_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('id, review')
        .eq('course_id', course.course_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
  
  const handleCardClick = () => {
    navigate(`/courses/${course.course_id}`);
  };
  
  const handleFullReviewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReviewSheetOpen(true);
  }, []);
  
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

  const badgeStyle = getRankingBadgeStyle(position);
  
  // Get tier info for rating display
  const tierData = rating !== undefined ? getScoreTier(rating) : null;
  const isOutstanding = tierData?.tier === 'outstanding';
  
  // Location subtitle
  const heroSubtitle = course.sub_country || course.country;

  return (
    <>
      <motion.div
        onClick={handleCardClick}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-white border border-[#e2e8f0] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
          "hover:shadow-md transition-all group",
          className
        )}
      >
        {/* Hero image - matching UnifiedCourseCard aspect ratio */}
        <div className="relative aspect-[1.77/1] overflow-hidden">
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Ranking badge - medal-style design (top left) */}
          <div 
            className={cn(
              "absolute top-3 left-3 rounded-full flex items-center justify-center font-bold",
              badgeStyle.size
            )}
            style={{
              background: badgeStyle.bg,
              color: badgeStyle.text,
              boxShadow: badgeStyle.shadow,
            }}
          >
            {position}
          </div>
          
          
          {/* Course info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h4 className="font-semibold text-white text-sm truncate mb-0.5">
              {course.name}
            </h4>
            <p className="text-white/80 text-xs truncate">
              {heroSubtitle}
            </p>
          </div>
        </div>
        
        {/* Rating bar section - overall only */}
        {rating !== undefined && tierData && (
          <div className="px-4 py-3 bg-background">
            <div className="flex items-start justify-between gap-3">
              {/* Left side - rating bar */}
              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {isOwnProfile ? "Your Rating" : "Their Rating"}
                  </span>
                  <span 
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-wide",
                      isOutstanding 
                       ? "text-[#d97706]" 
                       : "text-[#6b7280]"
                    )}
                  >
                    {tierData.label}
                  </span>
                </div>
                
                {/* Bar row */}
                <div className="flex items-center gap-1.5 w-full">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(rating / 10) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                      className={cn(
                        "h-full rounded-full",
                        isOutstanding ? "bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" : "bg-[#d1d5db]"
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Right side - rating number and CTA */}
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-lg font-bold text-muted-foreground">
                  {rating.toFixed(1)}
                </span>
                <button
                  onClick={handleFullReviewClick}
                  className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Full review
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      
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
                style={{ color: isOutstanding ? '#f59e0b' : '#9ca3af' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              <span 
                className="text-sm font-semibold uppercase tracking-wider mt-1"
                style={{ color: isOutstanding ? 'rgba(245, 158, 11, 0.8)' : 'rgba(156, 163, 175, 0.8)' }}
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
                background: isOutstanding 
                  ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' 
                  : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                boxShadow: isOutstanding 
                  ? '0 4px 14px rgba(251,191,36,0.25)' 
                  : '0 4px 14px rgba(107,114,128,0.25)',
                color: isOutstanding ? '#000' : '#fff',
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
