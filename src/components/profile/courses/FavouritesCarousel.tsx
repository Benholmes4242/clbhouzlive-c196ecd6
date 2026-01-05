/**
 * FavouritesCarousel - Crown jewel horizontal carousel for Top 10 Rated Courses
 * 
 * Matches the layout of Top100RecentRoundsCarousel from the progress page EXACTLY.
 * Uses UnifiedCourseCard for consistent card rendering.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserTopTenCourses, TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UnifiedCourseCard } from '@/components/courses/UnifiedCourseCard';
import { CourseCardModel } from '@/types/courseCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface FavouritesCarouselProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
  className?: string;
  onManage?: () => void;
}

/**
 * Convert TopTenCourse to CourseCardModel for UnifiedCourseCard
 */
function createCardModel(
  course: TopTenCourse, 
  position: number,
  userRating?: number
): CourseCardModel {
  return {
    id: course.course_id,
    name: course.name,
    imageUrl: course.thumbnail_image || undefined,
    locationText: course.sub_country || course.country,
    country: course.country,
    communityRating: userRating,
    ranks: {
      global: course.global_rank || undefined,
      regional: course.regional_rank || undefined,
      usa: course.usa_rank || undefined,
    },
    context: {
      isPlayedByViewer: true,
    },
  };
}

export const FavouritesCarousel: React.FC<FavouritesCarouselProps> = ({
  userId,
  isOwnProfile,
  displayName,
  className,
  onManage,
}) => {
  const navigate = useNavigate();
  const { topTen, isLoading } = useUserTopTenCourses(userId);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Stable sorted course IDs for consistent query key
  const courseIds = useMemo(() => 
    topTen.map(c => c.course_id).sort(), 
    [topTen]
  );

  // Fetch user ratings for overall scores
  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['user-course-ratings', userId, courseIds],
    enabled: !!userId && courseIds.length > 0,
    queryFn: async () => {
      if (courseIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', userId)
        .in('course_id', courseIds);

      if (error) throw error;
      return (data || []).reduce((acc: Record<string, number>, r) => {
        acc[r.course_id] = r.rating;
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

  // Dynamic subtitle
  const subtitle = isOwnProfile 
    ? "Your Personal Top 10 Golf Courses"
    : `${displayName || 'Their'} Personal Top 10 Golf Courses`;

  if (isLoading) {
    return (
      <section className={cn("w-full", className)}>
        <div className="flex items-center justify-between mb-2 px-2.5">
          <div className="h-4 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-2 overflow-hidden px-2.5">
          {[1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-[85%] aspect-[1.77/1] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (topTen.length === 0) {
    return (
      <section className={cn("mt-6 w-full", className)}>
        <div className="flex flex-col mb-2 px-2.5">
          <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            Top 10 Rated Courses
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        </div>
        
        {/* Premium empty state card */}
        <div className="mx-2.5 rounded-sq-md border border-border/50 bg-card/60 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {isOwnProfile ? "You haven't picked your Top 10 yet" : "No Top 10 courses selected yet"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {isOwnProfile 
              ? "Rate and rank your favourite courses to build your personal Top 10."
              : "This golfer hasn't selected their Top 10 courses yet."}
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
      {/* Section header - renamed to Top 10 Rated Courses */}
      <div className="flex items-center justify-between mb-3 px-2.5">
        <div className="flex flex-col">
          <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            Top 10 Rated Courses
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        </div>
        {isOwnProfile && onManage && (
          <button
            type="button"
            onClick={onManage}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Manage Top 10
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
        <CarouselContent className="-ml-2 px-2.5">
          {topTen.map((course) => {
            const rating = ratingsMap[course.course_id];
            const cardModel = createCardModel(course, course.position, rating);
            
            return (
              <CarouselItem 
                key={course.id} 
                className="pl-2 basis-[85%] sm:basis-[70%] md:basis-[50%]"
              >
                <UnifiedCourseCard
                  course={cardModel}
                  showRankBadges={true}
                  showRating={true}
                  hideLocation={true}
                  contextTag={`#${course.position}`}
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

      {/* Removed: "Add to favourites" CTA - as per brief */}
    </section>
  );
};