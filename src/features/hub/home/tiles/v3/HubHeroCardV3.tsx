/**
 * HubHeroCardV3 - Premium full-bleed hero card
 * 190-220px height, 22-26px radius, dark overlay gradient
 * Shows: Trip (priority), Game, or Fallback
 */

import React, { useState, useCallback } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin, Plane } from 'lucide-react';
import { useHubHeroDataV3, HeroGameData, HeroTripData, HeroFallbackData } from '../../hooks/useHubHeroDataV3';
import { YourGamesTripsSheetV2 } from '@/features/hub/components/your-games-trips-v2';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop&q=80';

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

// V3 Type pill - top left
function TypePill({ type }: { type: 'TRIP' | 'GAME' }) {
  return (
    <div 
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{
        background: type === 'TRIP' ? 'rgba(59, 130, 246, 0.90)' : 'rgba(16, 185, 129, 0.90)',
        color: '#fff',
        backdropFilter: 'blur(4px)',
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
          className="text-[26px] font-bold leading-tight line-clamp-2 drop-shadow-md"
          style={{ 
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            letterSpacing: '-0.3px',
          }}
        >
          {data.courseName}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <MapPin className="w-3.5 h-3.5 opacity-80" />
          <span 
            className="text-[14px] font-medium opacity-95 drop-shadow-sm"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
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
          className="text-[26px] font-bold leading-tight line-clamp-2 drop-shadow-md"
          style={{ 
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            letterSpacing: '-0.3px',
          }}
        >
          {data.tripName}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Plane className="w-3.5 h-3.5 opacity-80" />
          <span 
            className="text-[14px] font-medium opacity-95 drop-shadow-sm"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
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
          className="text-[11px] font-semibold uppercase tracking-wide opacity-80 mb-1"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        >
          Plan your next round
        </div>
        <div 
          className="text-[26px] font-bold leading-tight line-clamp-2 drop-shadow-md"
          style={{ 
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            letterSpacing: '-0.3px',
          }}
        >
          {data.courseName}
        </div>
        {data.courseLocation && (
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="w-3.5 h-3.5 opacity-80" />
            <span 
              className="text-[14px] font-medium opacity-90"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              {data.courseLocation}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export function HubHeroCardV3() {
  const { data: heroData, isLoading } = useHubHeroDataV3();
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);

  const handleClick = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  if (isLoading) {
    return (
      <div 
        className="relative overflow-hidden animate-pulse"
        style={{
          height: '200px',
          borderRadius: '24px',
          background: 'var(--hub-skeleton-base)',
        }}
      />
    );
  }

  const data = heroData?.primary;
  if (!data) return null;

  const imageUrl = (() => {
    if (imageError) return FALLBACK_HERO;
    if (data.type === 'game') return data.courseImageUrl || FALLBACK_HERO;
    if (data.type === 'trip') return data.primaryCourseImageUrl || FALLBACK_HERO;
    if (data.type === 'fallback') return data.courseImageUrl || FALLBACK_HERO;
    return FALLBACK_HERO;
  })();

  return (
    <>
      <button 
        onClick={handleClick}
        className="relative w-full overflow-hidden text-left transition-all duration-200 active:scale-[0.99]"
        style={{
          height: '200px',
          borderRadius: '24px',
          boxShadow: '0 16px 48px rgba(2, 6, 23, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Background image */}
        <img
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

        {/* Dark overlay gradient - stronger for better text legibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        
        {/* Left gradient for text legibility */}
        <div 
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '70%',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Content based on type */}
        {data.type === 'game' && <GameHeroContent data={data} />}
        {data.type === 'trip' && <TripHeroContent data={data} />}
        {data.type === 'fallback' && <FallbackHeroContent data={data} />}
      </button>

      <YourGamesTripsSheetV2
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
      />
    </>
  );
}
