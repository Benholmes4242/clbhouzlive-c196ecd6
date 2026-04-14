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
        <div className="mx-2.5 rounded-sq-md p-6 text-center" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(15,23,42,0.05)' }}>
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
            <button
              type="button"
              onClick={onAddRound}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-full hover:opacity-90 active:scale-[0.97] transition-all min-h-[44px]"
              style={{ backgroundColor: '#F7931E' }}
            >
              <Plus className="w-4 h-4" />
              Log your first round
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full px-4", className)}>
      {/* Section header - consistent styling */}
      <div className="mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
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
              className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: 'rgba(15,23,42,0.05)',
                border: '0.5px solid rgba(15,23,42,0.07)',
                color: current === 0 ? 'rgba(15,23,42,0.20)' : '#64748B',
                cursor: current === 0 ? 'not-allowed' : 'pointer',
              }}
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
                    idx === current ? 'w-5' : 'w-2'
                  )}
                  style={{ backgroundColor: idx === current ? 'rgba(15,23,42,0.50)' : 'rgba(15,23,42,0.15)' }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={current === count - 1}
              className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: 'rgba(15,23,42,0.05)',
                border: '0.5px solid rgba(15,23,42,0.07)',
                color: current === count - 1 ? 'rgba(15,23,42,0.20)' : '#64748B',
                cursor: current === count - 1 ? 'not-allowed' : 'pointer',
              }}
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
            className="w-full rounded-2xl border-dashed active:opacity-70 transition-opacity"
            style={{ borderColor: 'rgba(15,23,42,0.12)' }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add another Top 100 round
          </Button>
        </div>
      )}
    </section>
  );
}