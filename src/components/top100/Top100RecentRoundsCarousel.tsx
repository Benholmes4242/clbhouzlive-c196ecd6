import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Top100RecentRound } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';
import { UnifiedCourseCard } from '@/components/courses/UnifiedCourseCard';
import { fromTop100Round } from '@/lib/mappers/toCourseCardModel';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface Top100RecentRoundsCarouselProps {
  rounds: Top100RecentRound[];
  isOwnProfile: boolean;
  className?: string;
  onAddRound?: () => void;
}

/**
 * Recent Top 100 Rounds - Swipe snap carousel (F1)
 * 
 * Features:
 * - Swipeable snap carousel with Embla
 * - "View all rounds" link
 * - "Add another Top 100 round" CTA
 * - Date logged on each card (F2)
 */
export function Top100RecentRoundsCarousel({
  rounds,
  isOwnProfile,
  className,
  onAddRound,
}: Top100RecentRoundsCarouselProps) {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Update carousel state
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

  // Empty state with premium CTA
  if (!rounds || rounds.length === 0) {
    return (
      <section className={cn("mt-6 w-full", className)}>
        <div className="flex items-center justify-between mb-2 px-2.5">
          <h3 className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            Recent Top 100 rounds
          </h3>
        </div>
        
        {/* Premium empty state card (G3) */}
        <div className="mx-2.5 rounded-sq-md border border-border/50 bg-card/60 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {isOwnProfile ? 'No Top 100 rounds yet' : 'No rounds recorded'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {isOwnProfile 
              ? 'Log your first Top 100 round to start tracking your journey.'
              : 'No Top 100 rounds recorded yet.'}
          </p>
          {isOwnProfile && onAddRound && (
            <Button
              variant="default"
              size="sm"
              onClick={onAddRound}
              className="rounded-full"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log your first round
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full px-4", className)}>
      {/* Section header - consistent styling */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recent Top 100 rounds
        </h3>
      </div>

      {/* Swipe snap carousel (F1) */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 px-0.5">
          {rounds.slice(0, 25).map((round, index) => (
            <CarouselItem 
              key={`${round.course_id}-${round.played_at}`} 
              className="pl-2 basis-[85%] sm:basis-[70%] md:basis-[50%] snap-start"
            >
              <UnifiedCourseCard
                course={fromTop100Round(round)}
                showRankBadges={true}
                showRating={true}
                hideLocation={true}
                loggedDate={round.played_at}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation buttons - cleaner styling with better hover states */}
        {count > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              disabled={current === 0}
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200',
                current === 0
                  ? 'bg-muted text-muted-foreground/30 cursor-not-allowed'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95'
              )}
              aria-label="Previous round"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dot indicators - wider active dot */}
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(count, 5) }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    idx === current
                      ? 'w-5 bg-foreground/50'
                      : 'w-2 bg-foreground/15'
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={current === count - 1}
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200',
                current === count - 1
                  ? 'bg-muted text-muted-foreground/30 cursor-not-allowed'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95'
              )}
              aria-label="Next round"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Carousel>

      {/* Add round CTA (F3) - better styling */}
      {isOwnProfile && onAddRound && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddRound}
            className="w-full rounded-full border-dashed border-border hover:border-border/80 hover:bg-muted/30 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add another Top 100 round
          </Button>
        </div>
      )}
    </section>
  );
}