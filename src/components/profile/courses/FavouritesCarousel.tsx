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
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="h-4 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-2 overflow-hidden px-1">
          {[1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-[85%] aspect-[1.77/1] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Dynamic subtitle
  const getSubtitle = () => {
    if (isOwnProfile) {
      return "Your Personal Top 10";
    }
    return `${displayName || 'Their'}'s Personal Top 10`;
  };

  // Empty state
  if (topTen.length === 0) {
    return (
      <section className={cn("mt-6 w-full", className)}>
        <div className="flex flex-col mb-2 px-1">
          <h3 className="text-lg font-semibold text-foreground">
            Top 10 Rated Golf Courses
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSubtitle()}
          </p>
        </div>
        
        {/* Premium empty state card */}
        <div className="mx-1 rounded-sq-md border border-border/50 bg-card/60 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {isOwnProfile ? "You haven't picked your top 10 yet" : "No top 10 added yet"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {isOwnProfile 
              ? "Choose your top rated courses to showcase your all-time favourites."
              : "This golfer hasn't picked their top 10 courses yet."}
          </p>
          {isOwnProfile && onManage && (
            <Button
              variant="default"
              size="sm"
              onClick={onManage}
              className="rounded-full"
            >
              Build your Top 10
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full", className)}>
      {/* Section header - updated title and subtitle */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Top 10 Rated Golf Courses
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSubtitle()}
          </p>
        </div>
        {isOwnProfile && onManage && (
          <button
            type="button"
            onClick={onManage}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
        <CarouselContent className="-ml-2 px-1">
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
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              disabled={current === 0}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                current === 0
                  ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-muted/50 text-foreground hover:bg-muted'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(count, 5) }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    idx === current
                      ? 'w-5 bg-foreground/60'
                      : 'w-2 bg-foreground/20'
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={current === count - 1}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                current === count - 1
                  ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-muted/50 text-foreground hover:bg-muted'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Carousel>

      {/* Removed "Add to favourites" button per design brief */}
    </section>
  );
};
