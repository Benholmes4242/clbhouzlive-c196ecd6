/**
 * HubHeroCardV3 - Premium full-bleed hero card (LIV-inspired)
 * 220-240px height, bold typography, strong gradient overlays
 */

import React, { useState, useCallback } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin, Plane, ChevronRight } from 'lucide-react';
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

// V3 Type pill - sporty solid fill style
function TypePill({ type }: { type: 'TRIP' | 'GAME' }) {
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
      style={{
        height: '30px',
        background: type === 'TRIP' 
          ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
          : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
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
          height: '230px',
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
          height: '230px',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(2, 6, 23, 0.15), 0 8px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
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

        {/* Strong bottom gradient overlay for text legibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.08) 100%)',
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

        {/* Subtle tap affordance - chevron in circle */}
        <div 
          className="absolute right-4 bottom-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <ChevronRight className="w-4 h-4 text-white/80" />
        </div>

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
