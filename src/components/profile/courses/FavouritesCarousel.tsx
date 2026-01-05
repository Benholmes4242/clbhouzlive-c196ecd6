/**
 * FavouritesCarousel - Crown jewel horizontal carousel for favourite courses
 * 
 * "If Tiger Woods had a Top 10 list, this is where it would live."
 * 
 * Matches the design language of Recent Top 100 Rounds carousel.
 * Features cinematic imagery, ranking badges, and swipeable interaction.
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Trophy, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUserTopTenCourses, TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RatingPill } from '@/components/ui/RatingPill';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface FavouritesCarouselProps {
  userId: string;
  isOwnProfile: boolean;
  className?: string;
  onManage?: () => void;
}

interface FavouriteCardProps {
  course: TopTenCourse;
  position: number;
  userRating?: number;
  designScore?: number;
  conditionScore?: number;
  facilitiesScore?: number;
  onClick: () => void;
}

/**
 * Cinematic favourite course card with ranking badge overlay
 */
const FavouriteCard: React.FC<FavouriteCardProps> = ({
  course,
  position,
  userRating,
  designScore,
  conditionScore,
  facilitiesScore,
  onClick,
}) => {
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
  const hasBreakdown = designScore || conditionScore || facilitiesScore;

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="relative bg-card rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-border/40"
    >
      {/* Hero image */}
      <div className="aspect-[16/10] relative overflow-hidden">
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Rank badge - prominent position */}
        <div className="absolute top-3 left-3 z-10">
          <div className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-foreground">#{position}</span>
          </div>
        </div>

        {/* Top 100 badge */}
        {isTop100 && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full">
            <Trophy className="w-3 h-3 text-white" />
            <span className="text-[10px] font-semibold text-white">Top 100</span>
          </div>
        )}

        {/* Content overlay - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="font-semibold text-lg text-white truncate drop-shadow-md mb-0.5">
            {course.name}
          </h4>
          <p className="text-sm text-white/80 truncate mb-3">
            {course.sub_country || course.country}
          </p>

          {/* Rating row */}
          <div className="flex items-center gap-3">
            {userRating && userRating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-white">{userRating.toFixed(1)}</span>
              </div>
            )}

            {/* Mini breakdown */}
            {hasBreakdown && (
              <div className="flex items-center gap-2 text-[11px] text-white/70">
                {designScore && <span>Design {designScore.toFixed(1)}</span>}
                {conditionScore && <span>· Condition {conditionScore.toFixed(1)}</span>}
                {facilitiesScore && <span>· Facilities {facilitiesScore.toFixed(1)}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const FavouritesCarousel: React.FC<FavouritesCarouselProps> = ({
  userId,
  isOwnProfile,
  className,
  onManage,
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
        .select('course_id, rating, design_score, condition_score, facilities_score')
        .eq('user_id', userId)
        .in('course_id', courseIds);

      if (error) throw error;
      return (data || []).reduce((acc: Record<string, any>, r) => {
        acc[r.course_id] = {
          rating: r.rating,
          design: r.design_score,
          condition: r.condition_score,
          facilities: r.facilities_score,
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

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className={cn("py-4", className)}>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-[280px] aspect-[16/10] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (topTen.length === 0) {
    return (
      <section className={cn("py-4", className)}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-semibold text-foreground">Favourite Courses</h3>
        </div>
        
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {isOwnProfile ? "You haven't picked your favourites yet" : "No favourites added yet"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {isOwnProfile 
              ? "Choose your favourite courses to build your all-time list."
              : "This golfer hasn't picked their favourite courses yet."}
          </p>
          {isOwnProfile && onManage && (
            <Button onClick={onManage} size="sm" className="rounded-full">
              Build your Top 10
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("py-2", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-base font-semibold text-foreground">Favourite Courses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isOwnProfile 
              ? `Your all-time favourites · ${topTen.length} of 10`
              : `${topTen.length} of 10 favourites`}
          </p>
        </div>
        {isOwnProfile && onManage && (
          <button 
            onClick={onManage}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Manage favourites"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full -mx-1"
      >
        <CarouselContent className="-ml-3 px-1">
          {topTen.map((course) => {
            const ratings = ratingsMap[course.course_id];
            return (
              <CarouselItem 
                key={course.id} 
                className="pl-3 basis-[85%] sm:basis-[70%] md:basis-[50%] lg:basis-[40%]"
              >
                <FavouriteCard
                  course={course}
                  position={course.position}
                  userRating={ratings?.rating}
                  designScore={ratings?.design}
                  conditionScore={ratings?.condition}
                  facilitiesScore={ratings?.facilities}
                  onClick={() => handleCourseClick(course.course_id)}
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
    </section>
  );
};
