/**
 * FavouritesCarousel - Crown jewel carousel for Top 10 Rated Courses
 * 
 * Premium container with trophy icon, completion indicator, share CTA,
 * and encouragement messages for incomplete Top 10.
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronLeft, ChevronRight, Sparkles, Share2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserTopTenCourses, TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Top10CourseCard } from './Top10CourseCard';
import { toast } from 'sonner';

interface FavouritesCarouselProps {
  userId: string;
  isOwnProfile: boolean;
  className?: string;
  onManage?: () => void;
  displayName?: string;
}

export const FavouritesCarousel: React.FC<FavouritesCarouselProps> = ({
  userId,
  isOwnProfile,
  className,
  onManage,
  displayName,
}) => {
  const navigate = useNavigate();
  const { topTen, isLoading } = useUserTopTenCourses(userId);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Stable sorted course IDs for consistent query key (only for pinned courses without ratings)
  const courseIdsNeedingRatings = React.useMemo(() => 
    topTen
      .filter(c => c.is_pinned && c.rating == null)
      .map(c => c.course_id)
      .sort(), 
    [topTen]
  );

  // Fetch user ratings with breakdown scores (for pinned courses that don't have ratings)
  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['user-course-ratings-breakdown', userId, courseIdsNeedingRatings],
    enabled: !!userId && courseIdsNeedingRatings.length > 0,
    queryFn: async () => {
      if (courseIdsNeedingRatings.length === 0) return {};
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating, design_score, condition_score, facilities_score, clubhouse_score')
        .eq('user_id', userId)
        .in('course_id', courseIdsNeedingRatings);

      if (error) throw error;
      return (data || []).reduce((acc: Record<string, {
        rating: number;
        design_score: number | null;
        condition_score: number | null;
        facilities_score: number | null;
        clubhouse_score: number | null;
      }>, r) => {
        acc[r.course_id] = {
          rating: r.rating,
          design_score: r.design_score,
          condition_score: r.condition_score,
          facilities_score: r.facilities_score,
          clubhouse_score: r.clubhouse_score,
        };
        return acc;
      }, {});
    },
    staleTime: 60_000,
  });

  // Carousel state
  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);
  }, [api]);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  // Handle share
  const handleShare = () => {
    // For now, just show a toast - can be expanded to actual share functionality
    toast.success('Share feature coming soon!');
  };

  // Dynamic title
  const getTitle = () => {
    if (isOwnProfile) {
      return "Your Personal Top 10";
    }
    const firstName = displayName?.split(' ')[0] || 'Their';
    return `${firstName}'s Personal Top 10`;
  };

  // Dynamic subtitle
  const getSubtitle = () => {
    if (isOwnProfile) {
      return "The very best you've played";
    }
    const firstName = displayName?.split(' ')[0] || 'they';
    return `The very best ${firstName} has played`;
  };

  if (isLoading) {
    return (
      <section className={cn("w-full px-4", className)}>
        {/* Header skeleton */}
        <div className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#e2e8f0] animate-pulse" />
            <div>
              <div className="h-4 w-32 bg-[#e2e8f0] rounded mb-1.5 animate-pulse" />
              <div className="h-3 w-24 bg-[#e2e8f0] rounded animate-pulse" />
            </div>
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="flex-shrink-0 w-[85%] sm:w-[70%]">
              <div className="h-48 bg-[#e2e8f0] rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const courseCount = topTen.length;

  // Empty state - No card wrapper
  if (courseCount === 0) {
    return (
      <section className={cn("w-full px-4", className)}>
        {/* Header */}
        <div className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 flex items-center justify-center">
              <Trophy className="w-[18px] h-[18px] text-amber-500" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1e293b]">
                {getTitle()}
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                {getSubtitle()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Empty Content Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] px-6 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-[#94a3b8]" />
          </div>
          
          <h3 className="text-base font-semibold text-[#1e293b] mb-1">
            {isOwnProfile ? "Build Your Top 10" : "No Top 10 Yet"}
          </h3>
          
          <p className="text-sm text-[#64748b] mb-5 max-w-xs mx-auto">
            {isOwnProfile 
              ? "Curate your all-time favourite courses and share your taste with the world"
              : "This golfer hasn't picked their top 10 courses yet."}
          </p>
          
          {isOwnProfile && onManage && (
            <button
              onClick={onManage}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-medium rounded-full hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm"
            >
              Start Building
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full px-4", className)}>
      {/* Header Area - Now directly on page background */}
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Trophy Icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 flex items-center justify-center">
              <Trophy className="w-[18px] h-[18px] text-amber-500" />
            </div>
            
            <div>
              <h2 className="text-[16px] font-semibold text-[#1e293b]">
                {getTitle()}
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                {getSubtitle()}
              </p>
            </div>
          </div>
          
          {/* Right side - Completion + Manage */}
          <div className="flex items-center gap-3">
            {/* Completion Indicator */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#1e293b]">{courseCount}</span>
              <span className="text-sm text-[#94a3b8]">/10</span>
            </div>
            
            {/* Manage Link */}
            {isOwnProfile && onManage && (
              <button
                onClick={onManage}
                className="text-xs font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                Manage →
              </button>
            )}
          </div>
        </div>
        
        {/* Completion Encouragement - show if less than 10 */}
        {isOwnProfile && courseCount < 10 && courseCount > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg border border-[#e2e8f0]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-[#64748b]">
              Add {10 - courseCount} more {10 - courseCount === 1 ? 'course' : 'courses'} to complete your Top 10
            </p>
          </div>
        )}
      </div>
      
      {/* Carousel Area - Cards shown directly, no outer container */}
      <div className="py-2 -mx-4">
        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 pl-0 pr-4">
            {topTen.map((course) => {
              // Use rating from course if available (auto-populated), otherwise from ratingsMap (pinned)
              const ratingData = ratingsMap[course.course_id];
              const displayRating = course.rating ?? ratingData?.rating;
              
              return (
                <CarouselItem 
                  key={course.id} 
                  className={cn(
                    "pl-2",
                    course.position === 1
                      ? "basis-[80%] sm:basis-[70%]"
                      : "basis-[72%] sm:basis-[60%] md:basis-[50%]"
                  )}
                >
                  <Top10CourseCard
                    course={course}
                    position={course.position}
                    rating={displayRating}
                    isOwnProfile={isOwnProfile}
                    userId={userId}
                  />
                </CarouselItem>
              );
            })}
            
            {/* Empty slot placeholders - show up to 2 */}
            {isOwnProfile && courseCount < 10 && courseCount > 0 && (
              <>
                {Array.from({ length: Math.min(10 - courseCount, 2) }).map((_, index) => (
                  <CarouselItem
                    key={`empty-${index}`}
                    className="pl-2 basis-[40%] sm:basis-[30%]"
                  >
                    <div 
                      className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-[#e2e8f0] bg-white/60 flex flex-col items-center justify-center p-4 cursor-pointer hover:border-[#cbd5e1] transition-colors"
                      onClick={onManage}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#e2e8f0] flex items-center justify-center mb-2">
                        <Plus className="w-5 h-5 text-[#94a3b8]" />
                      </div>
                      <p className="text-xs text-[#94a3b8] text-center">
                        Add #{courseCount + index + 1}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </>
            )}
          </CarouselContent>

          {/* Navigation controls */}
          {count > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 px-4">
              <button
                type="button"
                onClick={() => api?.scrollPrev()}
                disabled={current === 0}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  current === 0
                    ? 'bg-white/60 text-[#cbd5e1] cursor-not-allowed'
                    : 'bg-white hover:bg-[#f1f5f9] text-[#1e293b] shadow-sm'
                )}
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(count, 5) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => api?.scrollTo(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-200',
                      idx === current
                        ? 'w-5 bg-[#1e293b]'
                        : 'w-1.5 bg-[#cbd5e1] hover:bg-[#94a3b8]'
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => api?.scrollNext()}
                disabled={current === count - 1}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  current === count - 1
                    ? 'bg-white/60 text-[#cbd5e1] cursor-not-allowed'
                    : 'bg-white hover:bg-[#f1f5f9] text-[#1e293b] shadow-sm'
                )}
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </Carousel>
      </div>
      
      {/* Footer - Share CTA */}
      {isOwnProfile && courseCount >= 3 && (
        <div className="pt-3">
          <button
            onClick={handleShare}
            className="w-full py-2.5 text-sm font-medium text-[#64748b] hover:text-[#1e293b] bg-white hover:bg-[#f8fafc] rounded-xl border border-[#e2e8f0] shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share your Top 10
          </button>
        </div>
      )}
    </section>
  );
};
