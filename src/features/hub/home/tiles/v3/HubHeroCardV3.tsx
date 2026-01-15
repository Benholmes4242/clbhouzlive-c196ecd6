/**
 * HubHeroCardV3 - Premium full-bleed hero card with carousel
 * Auto-rotates through trips and games, glassy badges
 */

import { useState, useCallback, useEffect } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin, Plane, ChevronRight, Plus, Calendar } from 'lucide-react';
import { useHubHeroDataV3, HeroGameData, HeroTripData, HeroFallbackData, HeroData } from '../../hooks/useHubHeroDataV3';
import { YourGamesTripsSheetV2 } from '@/features/hub/components/your-games-trips-v2';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop&q=80';
const AUTO_ROTATE_INTERVAL = 10000; // 10 seconds

function formatGameDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE d MMM · h:mm a");
}

function formatTripDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${format(start, 'd')}–${format(end, 'd MMM yyyy')}`;
}

// V3 Type pill - glassy frosted effect
function TypePill({ type }: { type: 'TRIP' | 'GAME' }) {
  const isTrip = type === 'TRIP';
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
      style={{
        height: '32px',
        background: isTrip 
          ? 'rgba(59, 130, 246, 0.25)' 
          : 'rgba(34, 197, 94, 0.25)',
        color: '#fff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isTrip 
          ? '1px solid rgba(59, 130, 246, 0.4)' 
          : '1px solid rgba(34, 197, 94, 0.4)',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {type}
    </div>
  );
}

// Game Variant
function GameHeroContent({ data }: { data: HeroGameData }) {
  return (
    <>
      <div className="absolute left-5 top-5">
        <TypePill type="GAME" />
      </div>
      <div className="absolute left-5 bottom-5 right-5 text-white">
        <div 
          className="font-extrabold leading-[1.08] line-clamp-2 drop-shadow-lg"
          style={{ 
            fontSize: '32px',
            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            letterSpacing: '-0.5px',
          }}
        >
          {data.courseName}
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <MapPin className="w-4 h-4 opacity-90" />
          <span 
            className="text-[15px] font-semibold opacity-95"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
          >
            {formatGameDate(data.startTimeISO)}
          </span>
        </div>
      </div>
    </>
  );
}

// Trip Variant
function TripHeroContent({ data }: { data: HeroTripData }) {
  return (
    <>
      <div className="absolute left-5 top-5">
        <TypePill type="TRIP" />
      </div>
      <div className="absolute left-5 bottom-5 right-5 text-white">
        <div 
          className="font-extrabold leading-[1.08] line-clamp-2 drop-shadow-lg"
          style={{ 
            fontSize: '32px',
            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            letterSpacing: '-0.5px',
          }}
        >
          {data.tripName}
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <Plane className="w-4 h-4 opacity-90" />
          <span 
            className="text-[15px] font-semibold opacity-95"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
          >
            {formatTripDateRange(data.startDate, data.endDate)}
            {data.location && ` · ${data.location}`}
          </span>
        </div>
      </div>
    </>
  );
}

// Fallback Variant - Discover style
function FallbackHeroContent({ data }: { data: HeroFallbackData }) {
  return (
    <>
      <div className="absolute left-5 bottom-5 right-5 text-white">
        <div 
          className="text-[11px] font-bold uppercase tracking-wider opacity-85 mb-1.5"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}
        >
          Plan your next round
        </div>
        <div 
          className="font-extrabold leading-[1.08] line-clamp-2 drop-shadow-lg"
          style={{ 
            fontSize: '32px',
            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            letterSpacing: '-0.5px',
          }}
        >
          {data.courseName}
        </div>
        {data.courseLocation && (
          <div className="flex items-center gap-2 mt-2.5">
            <MapPin className="w-4 h-4 opacity-90" />
            <span 
              className="text-[15px] font-semibold opacity-95"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
            >
              {data.courseLocation}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// Empty state for when user has no games/trips
function HeroEmptyState({ onCreateGame }: { onCreateGame: () => void }) {
  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{
        height: '250px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
        boxShadow: '0 24px 60px rgba(2, 6, 23, 0.18), 0 12px 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-6 right-6 w-32 h-32 rounded-full border-2 border-white/30" />
        <div className="absolute bottom-6 left-6 w-24 h-24 rounded-full border-2 border-white/30" />
        <div className="absolute top-1/2 right-8 -translate-y-1/2 w-20 h-20 rounded-full bg-white/10" />
      </div>
      
      {/* Decorative golf ball */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        <div>
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold mb-4"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <Calendar className="w-3.5 h-3.5" />
            No upcoming games
          </div>
          
          <h2 
            className="text-2xl font-bold text-white mb-2 drop-shadow-lg"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            Plan Your Next Round
          </h2>
          
          <p className="text-white/80 text-sm max-w-[240px]">
            Create a game to invite friends and organise your next round of golf
          </p>
        </div>
        
        {/* CTA */}
        <div>
          <button
            onClick={() => {
              haptic('light');
              onCreateGame();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 text-sm font-semibold rounded-full hover:bg-white/90 transition-colors shadow-lg active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create Game
          </button>
        </div>
      </div>
    </div>
  );
}

// Carousel dot indicator
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
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onDotClick(i);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onDotClick(i);
            }
          }}
          className="w-2 h-2 rounded-full transition-all duration-300 cursor-pointer"
          style={{
            background: i === activeIndex 
              ? 'rgba(255,255,255,0.95)' 
              : 'rgba(255,255,255,0.4)',
            transform: i === activeIndex ? 'scale(1.2)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
}

export function HubHeroCardV3() {
  const { data: heroData, isLoading } = useHubHeroDataV3();
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);

  // Build carousel items array
  const carouselItems: HeroData[] = [];
  if (heroData?.primary) carouselItems.push(heroData.primary);
  if (heroData?.secondary) carouselItems.push(heroData.secondary);

  // Auto-rotate carousel
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % carouselItems.length);
    }, AUTO_ROTATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // Reset image state when active index changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [activeIndex]);

  const handleClick = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  const handleDotClick = (index: number) => {
    haptic('light');
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <div 
        className="relative overflow-hidden animate-pulse"
        style={{
          height: '230px',
          borderRadius: '24px',
          background: 'var(--hub-skeleton-base)',
        }}
      />
    );
  }

  // Show empty state if no data
  if (carouselItems.length === 0) {
    return (
      <>
        <HeroEmptyState onCreateGame={() => setCreateOpen(true)} />
        <CreateGameTripSheetV2
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      </>
    );
  }

  const currentItem = carouselItems[activeIndex];

  const imageUrl = (() => {
    if (imageError) return FALLBACK_HERO;
    if (currentItem.type === 'game') return currentItem.courseImageUrl || FALLBACK_HERO;
    if (currentItem.type === 'trip') return currentItem.primaryCourseImageUrl || FALLBACK_HERO;
    if (currentItem.type === 'fallback') return currentItem.courseImageUrl || FALLBACK_HERO;
    return FALLBACK_HERO;
  })();

  return (
    <>
      <button 
        onClick={handleClick}
        className="relative w-full overflow-hidden text-left transition-all duration-200 active:scale-[0.99]"
        style={{
          height: '250px',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(2, 6, 23, 0.18), 0 12px 24px rgba(0,0,0,0.10)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}
      >
        {/* Background image with crossfade */}
        <img
          key={`${activeIndex}-${imageUrl}`}
          src={imageUrl}
          alt="Hero background"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
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

        {/* Premium vignette gradient overlay for text legibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.05) 100%)',
          }}
        />
        
        {/* Left gradient for extra text legibility */}
        <div 
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '65%',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Premium tap affordance - glass chevron circle */}
        <div 
          className="absolute right-4 top-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <ChevronRight className="w-5 h-5 text-white/90" />
        </div>

        {/* Content based on type */}
        {currentItem.type === 'game' && <GameHeroContent data={currentItem} />}
        {currentItem.type === 'trip' && <TripHeroContent data={currentItem} />}
        {currentItem.type === 'fallback' && <FallbackHeroContent data={currentItem} />}

        {/* Carousel dots */}
        <CarouselDots 
          count={carouselItems.length} 
          activeIndex={activeIndex} 
          onDotClick={handleDotClick}
        />
      </button>

      <YourGamesTripsSheetV2
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
      />
      
      <CreateGameTripSheetV2
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
