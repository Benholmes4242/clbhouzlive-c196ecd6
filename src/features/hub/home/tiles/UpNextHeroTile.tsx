/**
 * UpNextHeroTile - "What's Up Next" Hero Card
 * Supports Game, Trip, and Fallback variants with carousel
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin, Plane } from 'lucide-react';
import { useHubHeroData, HeroGameData, HeroTripData, HeroFallbackData } from '../hooks/useHubHeroData';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { SlotsPill } from '@/features/nearby/components/your-games/SlotsPill';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

// Carousel auto-rotate interval (ms)
const CAROUSEL_INTERVAL = 4500;

// Fallback hero image
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

// =========================================
// Game Variant
// =========================================
function GameHeroContent({ data }: { data: HeroGameData }) {
  return (
    <div className="absolute left-4 top-4 right-4 text-white">
      <div className="flex items-start gap-2">
        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[22px] font-extrabold leading-tight line-clamp-1">
            {data.courseName}
          </div>
          <div className="text-[15px] font-medium mt-1 opacity-95">
            {formatGameDate(data.startTimeISO)}
          </div>
          <SlotsPill 
            slotsOpen={data.slotsOpen} 
            slotsTotal={data.slotsTotal}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// =========================================
// Trip Variant
// =========================================
function TripHeroContent({ data }: { data: HeroTripData }) {
  return (
    <div className="absolute left-4 top-4 right-4 text-white">
      <div className="flex items-start gap-2">
        <Plane className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[22px] font-extrabold leading-tight line-clamp-1">
            {data.tripName}
          </div>
          <div className="text-[15px] font-medium mt-1 opacity-95">
            {formatTripDateRange(data.startDate, data.endDate)}
          </div>
          {/* No player pill for trips */}
        </div>
      </div>
    </div>
  );
}

// =========================================
// Fallback Variant
// =========================================
function FallbackHeroContent({ data }: { data: HeroFallbackData }) {
  return (
    <div className="absolute left-4 top-4 right-4 text-white">
      <div>
        <div className="text-[14px] font-semibold opacity-80 mb-1">
          #{data.rank} Course in the World
        </div>
        <div className="text-[22px] font-extrabold leading-tight line-clamp-1">
          {data.courseName}
        </div>
        {data.courseLocation && (
          <div className="text-[14px] font-medium mt-1 opacity-90">
            {data.courseLocation}
          </div>
        )}
      </div>
      {/* CTA overlay at bottom */}
      <div 
        className="absolute bottom-4 left-4 right-4 text-center text-[13px] font-medium opacity-75"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      >
        Plan a game or golf trip to see it here.
      </div>
    </div>
  );
}

// =========================================
// Hero Card Slide
// =========================================
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

      {/* Gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)',
        }}
      />

      {/* Content based on type */}
      {data.type === 'game' && <GameHeroContent data={data} />}
      {data.type === 'trip' && <TripHeroContent data={data} />}
      {data.type === 'fallback' && <FallbackHeroContent data={data} />}
    </button>
  );
}

// =========================================
// Carousel Dots
// =========================================
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
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            i === activeIndex 
              ? "bg-white w-4" 
              : "bg-white/50"
          )}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

// =========================================
// Main Component
// =========================================
export function UpNextHeroTile() {
  const { data: heroData, isLoading } = useHubHeroData();
  const [activeIndex, setActiveIndex] = useState(0);
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [gamesHubInitialTab, setGamesHubInitialTab] = useState<'discover' | 'yours'>('yours');
  const touchStartX = useRef<number | null>(null);
  const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);

  // Build slides array
  const slides = React.useMemo(() => {
    if (!heroData?.primary) return [];
    const arr = [heroData.primary];
    if (heroData.secondary) arr.push(heroData.secondary);
    return arr;
  }, [heroData]);

  // Auto-rotate carousel
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

  // Reset auto-rotate on manual interaction
  const resetAutoRotate = useCallback(() => {
    if (autoRotateTimer.current) {
      clearInterval(autoRotateTimer.current);
      autoRotateTimer.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % slides.length);
      }, CAROUSEL_INTERVAL);
    }
  }, [slides.length]);

  // Handle swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || slides.length <= 1) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - next
        setActiveIndex(prev => (prev + 1) % slides.length);
      } else {
        // Swipe right - prev
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
      // TODO: Open trip details when trips feature exists
      setGamesHubInitialTab('yours');
      setGamesHubOpen(true);
    } else if (currentSlide.type === 'fallback') {
      // Open create game modal
      setGamesHubInitialTab('discover');
      setGamesHubOpen(true);
    }
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    resetAutoRotate();
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div 
        className="relative rounded-[26px] overflow-hidden"
        style={{
          height: '165px',
          background: 'var(--hub-skeleton-base)',
        }}
      >
        <div className="absolute inset-0 animate-pulse" />
      </div>
    );
  }

  // No data at all (shouldn't happen with fallback)
  if (slides.length === 0) {
    return null;
  }

  return (
    <>
      <div 
        className="relative w-full rounded-[26px] overflow-hidden"
        style={{
          height: '165px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
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

        {/* Carousel dots */}
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
