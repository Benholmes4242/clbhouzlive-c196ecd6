/**
 * UpNextHeroTile V2 - Premium "What's Up Next" Hero Card
 * Stronger shadow, bottom fade gradient, glass pill badge
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin, Plane, Users } from 'lucide-react';
import { useHubHeroData, HeroGameData, HeroTripData, HeroFallbackData } from '../hooks/useHubHeroData';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { SlotsPill } from '@/features/nearby/components/your-games/SlotsPill';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const CAROUSEL_INTERVAL = 4500;
const FALLBACK_HERO = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop&q=80';

function formatGameDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE · h:mm a");
}

function formatTripDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${format(start, 'd')}–${format(end, 'd MMM')}`;
}

// V2 Glass icon chip - top left (premium styling)
function IconChip({ icon: Icon }: { icon: typeof MapPin }) {
  return (
    <div 
      className="h-8 w-8 rounded-full flex items-center justify-center"
      style={{
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 6px 16px rgba(2, 6, 23, 0.08)',
      }}
    >
      <Icon className="w-4 h-4 text-slate-700" />
    </div>
  );
}

// V2 Progress pill
function ProgressPill({ text }: { text: string }) {
  return (
    <div
      className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        color: 'var(--hub-text)',
        border: '1px solid var(--hub-card-border)',
      }}
    >
      {text}
    </div>
  );
}

// Game Variant - with RSVP summary
function GameHeroContent({ data }: { data: HeroGameData }) {
  return (
    <>
      <div className="absolute left-4 top-4">
        <IconChip icon={MapPin} />
      </div>
      <div className="absolute left-4 bottom-4 right-4 text-white">
        <div className="text-[20px] font-bold leading-tight line-clamp-1 drop-shadow-sm">
          {data.courseName}
        </div>
        <div className="text-[14px] font-medium mt-1 opacity-95 drop-shadow-sm">
          {formatGameDate(data.startTimeISO)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <ProgressPill text={`${data.slotsTotal - data.slotsOpen}/${data.slotsTotal}`} />
          {/* RSVP summary - show if joinedCount exists (even 0) */}
          {data.joinedCount !== undefined && (
            <span 
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              <Users className="w-3 h-3" />
              {data.joinedCount} joined
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// Trip Variant
function TripHeroContent({ data }: { data: HeroTripData }) {
  return (
    <>
      <div className="absolute left-4 top-4">
        <IconChip icon={Plane} />
      </div>
      <div className="absolute left-4 bottom-4 right-4 text-white">
        <div className="text-[20px] font-bold leading-tight line-clamp-1 drop-shadow-sm">
          {data.tripName}
        </div>
        <div className="text-[14px] font-medium mt-1 opacity-95 drop-shadow-sm">
          {formatTripDateRange(data.startDate, data.endDate)}
        </div>
      </div>
    </>
  );
}

// Fallback Variant
function FallbackHeroContent({ data }: { data: HeroFallbackData }) {
  return (
    <>
      <div className="absolute left-4 top-4">
        <IconChip icon={MapPin} />
      </div>
      <div className="absolute left-4 bottom-4 right-4 text-white">
        <div className="text-[12px] font-semibold opacity-80 mb-1 drop-shadow-sm">
          #{data.rank} Course in the World
        </div>
        <div className="text-[20px] font-bold leading-tight line-clamp-1 drop-shadow-sm">
          {data.courseName}
        </div>
        {data.courseLocation && (
          <div className="text-[13px] font-medium mt-1 opacity-90 drop-shadow-sm">
            {data.courseLocation}
          </div>
        )}
      </div>
      <div 
        className="absolute bottom-4 right-4 text-[12px] font-medium text-white/70"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      >
        Plan a game →
      </div>
    </>
  );
}

// Hero Card Slide
interface HeroSlideProps {
  data: HeroGameData | HeroTripData | HeroFallbackData;
  onClick: () => void;
  isActive: boolean;
}

function HeroSlide({ data, onClick, isActive }: HeroSlideProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);

  const imageUrl = (() => {
    if (imageError) return FALLBACK_HERO;
    if (data.type === 'game') return data.courseImageUrl || FALLBACK_HERO;
    if (data.type === 'trip') return data.primaryCourseImageUrl || FALLBACK_HERO;
    if (data.type === 'fallback') return data.courseImageUrl || FALLBACK_HERO;
    return FALLBACK_HERO;
  })();

  return (
    <button 
      className={cn(
        "absolute inset-0 w-full h-full text-left transition-opacity duration-500",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
      )}
      onClick={onClick}
      tabIndex={isActive ? 0 : -1}
    >
      {/* Background image */}
      <img
        src={imageUrl}
        alt="Hero background"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        style={{ opacity: imageLoaded ? 1 : 0 }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="eager"
      />
      
      {/* Placeholder while loading */}
      {!imageLoaded && (
        <div 
          className="absolute inset-0 animate-pulse"
          style={{ background: 'var(--hub-skeleton-base)' }}
        />
      )}

      {/* V2 Bottom fade gradient - reduced opacity to prevent muddy look */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.28) 100%)',
        }}
      />
      
      {/* V2 Left gradient for text legibility - only behind text column */}
      <div 
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: '60%',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Content based on type */}
      {data.type === 'game' && <GameHeroContent data={data} />}
      {data.type === 'trip' && <TripHeroContent data={data} />}
      {data.type === 'fallback' && <FallbackHeroContent data={data} />}
    </button>
  );
}

// Carousel Dots
function CarouselDots({ 
  count, 
  activeIndex, 
  onDotClick 
}: { 
  count: number; 
  activeIndex: number; 
  onDotClick: (index: number) => void;
}) {
  if (count <= 1) return null;
  
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onDotClick(i);
          }}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === activeIndex ? '14px' : '6px',
            height: '6px',
            background: i === activeIndex ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.45)',
          }}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

// Main Component
export function UpNextHeroTile() {
  const { data: heroData, isLoading } = useHubHeroData();
  const [activeIndex, setActiveIndex] = useState(0);
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [gamesHubInitialTab, setGamesHubInitialTab] = useState<'discover' | 'yours'>('yours');
  const touchStartX = useRef<number | null>(null);
  const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);

  const slides = React.useMemo(() => {
    if (!heroData?.primary) return [];
    const arr = [heroData.primary];
    if (heroData.secondary) arr.push(heroData.secondary);
    return arr;
  }, [heroData]);

  useEffect(() => {
    if (!heroData?.hasCarousel || slides.length <= 1) return;

    const startAutoRotate = () => {
      autoRotateTimer.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % slides.length);
      }, CAROUSEL_INTERVAL);
    };

    startAutoRotate();

    return () => {
      if (autoRotateTimer.current) {
        clearInterval(autoRotateTimer.current);
      }
    };
  }, [heroData?.hasCarousel, slides.length]);

  const resetAutoRotate = useCallback(() => {
    if (autoRotateTimer.current) {
      clearInterval(autoRotateTimer.current);
      autoRotateTimer.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % slides.length);
      }, CAROUSEL_INTERVAL);
    }
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || slides.length <= 1) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveIndex(prev => (prev + 1) % slides.length);
      } else {
        setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
      }
      resetAutoRotate();
    }
    
    touchStartX.current = null;
  };

  const handleSlideClick = () => {
    haptic('light');
    const currentSlide = slides[activeIndex];
    
    if (!currentSlide) return;

    if (currentSlide.type === 'game') {
      setGamesHubInitialTab('yours');
      setGamesHubOpen(true);
    } else if (currentSlide.type === 'trip') {
      setGamesHubInitialTab('yours');
      setGamesHubOpen(true);
    } else if (currentSlide.type === 'fallback') {
      setGamesHubInitialTab('discover');
      setGamesHubOpen(true);
    }
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    resetAutoRotate();
  };

  if (isLoading) {
    return (
      <div 
        className="relative overflow-hidden"
        style={{
          height: '150px',
          borderRadius: 'var(--hub-radius-xl)',
          background: 'var(--hub-skeleton-base)',
        }}
      >
        <div className="absolute inset-0 animate-pulse" />
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <>
      <div 
        className="relative w-full overflow-hidden transition-shadow duration-200"
        style={{
          height: '150px',
          borderRadius: 'var(--hub-radius-xl)', // 24px for hero
          boxShadow: 'var(--hub-shadow-hero)',
          border: '1px solid rgba(255, 255, 255, 0.18)', // Glass edge
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <HeroSlide
            key={slide.type === 'game' ? slide.gameId : slide.type === 'trip' ? slide.tripId : 'fallback'}
            data={slide}
            onClick={handleSlideClick}
            isActive={index === activeIndex}
          />
        ))}

        <CarouselDots 
          count={slides.length} 
          activeIndex={activeIndex} 
          onDotClick={handleDotClick}
        />
      </div>

      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab={gamesHubInitialTab}
      />
    </>
  );
}
