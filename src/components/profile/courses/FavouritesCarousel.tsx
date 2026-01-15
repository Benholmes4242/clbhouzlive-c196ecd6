/**
 * FavouritesCarousel - Crown jewel carousel for Top 10 Rated Courses
 * 
 * Renamed from "Favourite Courses" to "Top 10 Rated Courses" per design brief.
 * Uses UnifiedCourseCard for consistent card rendering with rating bars.
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface FavouritesCarouselProps {
  userId: string;
  isOwnProfile: boolean;
  className?: string;
  onManage?: () => void;
  displayName?: string; // For subtitle on other profiles
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

  // Stable sorted course IDs for consistent query key
  const courseIds = React.useMemo(() => 
    topTen.map(c => c.course_id).sort(), 
    [topTen]
  );

  // Fetch user ratings with breakdown scores
  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['user-course-ratings-breakdown', userId, courseIds],
    enabled: !!userId && courseIds.length > 0,
    queryFn: async () => {
      if (courseIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating, design_score, condition_score, facilities_score, clubhouse_score')
        .eq('user_id', userId)
        .in('course_id', courseIds);

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

  if (isLoading) {
    return (
      <section className={cn("w-full", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-[85%] aspect-[1.77/1] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

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

  // Empty state
  if (topTen.length === 0) {
    return (
      <section className={cn("w-full", className)}>
        {/* Section header */}
        <div className="flex items-center justify-between mb-3 px-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1e293b]">
              {getTitle()}
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              {getSubtitle()}
            </p>
          </div>
        </div>
        
        {/* Empty state card */}
        <div className="mx-4 bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-[#64748b]" />
            </div>
            
            {/* Title */}
            <h3 className="text-base font-semibold text-[#1e293b] mb-1">
              {isOwnProfile ? "Build Your Top 10" : "No Top 10 Yet"}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-[#64748b] mb-5 max-w-xs">
              {isOwnProfile 
                ? "Choose your top rated courses to showcase your all-time favourites"
                : "This golfer hasn't picked their top 10 courses yet."}
            </p>
            
            {/* CTA */}
            {isOwnProfile && onManage && (
              <button
                onClick={onManage}
                className="px-5 py-2 bg-[#1e293b] text-white text-sm font-medium rounded-full hover:bg-[#334155] transition-colors"
              >
                Add Courses
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1e293b]">
            {getTitle()}
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            {getSubtitle()}
          </p>
        </div>
        {isOwnProfile && onManage && (
          <button
            type="button"
            onClick={onManage}
            className="text-xs font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            Manage Top 10 →
          </button>
        )}
      </div>

      {/* Swipe snap carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {topTen.map((course) => {
            const ratingData = ratingsMap[course.course_id];
            
            return (
              <CarouselItem 
                key={course.id} 
                className="pl-2 basis-[85%] sm:basis-[70%] md:basis-[50%]"
              >
                <Top10CourseCard
                  course={course}
                  position={course.position}
                  rating={ratingData?.rating}
                  breakdown={{
                    design: ratingData?.design_score,
                    condition: ratingData?.condition_score,
                    facilities: ratingData?.facilities_score,
                    experience: ratingData?.clubhouse_score,
                  }}
                />
              </CarouselItem>
            );
          })}
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
                  ? 'bg-[#f8fafc] text-[#cbd5e1] cursor-not-allowed'
                  : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b]'
              )}
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
                  ? 'bg-[#f8fafc] text-[#cbd5e1] cursor-not-allowed'
                  : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b]'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Carousel>
    </section>
  );
};
