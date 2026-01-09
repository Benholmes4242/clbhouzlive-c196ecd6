/**
 * UpNextHeroTile - "What's Up Next" Hero Card
 * Full-width course image with overlay, matches Golf OS mock
 */

import React, { useState, useCallback } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin } from 'lucide-react';
import { useNextUserGame } from '../hooks/useNextUserGame';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';

// Fallback hero image when course has no image
const FALLBACK_HERO = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop&q=80';

function formatGameDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE · h:mm a");
}

export function UpNextHeroTile() {
  const { data: nextGame, isLoading } = useNextUserGame();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [gamesHubInitialTab, setGamesHubInitialTab] = useState<'discover' | 'yours'>('discover');

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);

  const openViewGame = () => {
    haptic('light');
    setGamesHubInitialTab('yours');
    setGamesHubOpen(true);
  };

  // Determine hero image URL
  const heroImageUrl = React.useMemo(() => {
    if (imageError) return FALLBACK_HERO;
    if (nextGame?.course?.heroImageUrl) return nextGame.course.heroImageUrl;
    return FALLBACK_HERO;
  }, [nextGame, imageError]);

  // Loading skeleton - 10% taller (165px)
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

  // Empty state - no upcoming game (will be handled by parent layout)
  if (!nextGame) {
    return null;
  }

  // With upcoming game - show hero with course image (10% taller: 165px)
  const courseName = nextGame.course?.name || nextGame.courseName || 'Course TBD';

  return (
    <>
      <button 
        className="relative w-full rounded-[26px] overflow-hidden text-left transition-transform active:scale-[0.98]"
        style={{
          height: '165px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        }}
        onClick={openViewGame}
      >
        {/* Background image */}
        <img
          src={heroImageUrl}
          alt={courseName}
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

        {/* Gradient overlay for text legibility - from left side */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)',
          }}
        />

        {/* Content overlay */}
        <div className="absolute left-4 top-4 right-4 text-white">
          {/* Location pin + Course name */}
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[22px] font-extrabold leading-tight line-clamp-1">
                {courseName}
              </div>
              <div className="text-[15px] font-medium mt-1 opacity-95">
                {formatGameDate(nextGame.startTimeISO)}
              </div>
            </div>
          </div>
        </div>
      </button>

      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab={gamesHubInitialTab}
      />
    </>
  );
}
