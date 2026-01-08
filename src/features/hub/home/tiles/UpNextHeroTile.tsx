/**
 * UpNextHeroTile - Dynamic "What's Up Next" Hero Section
 * Shows course image + game details OR empty state CTAs
 */

import React, { useState, useCallback } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import { useNextUserGame } from '../hooks/useNextUserGame';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';

// Fallback hero image when course has no image
const FALLBACK_HERO = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop&q=80';

function formatGameDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE, MMM d · h:mm a");
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

  const openFindGame = () => {
    haptic('light');
    setGamesHubInitialTab('discover');
    setGamesHubOpen(true);
  };

  const openCreateGame = () => {
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div 
        className="relative rounded-3xl overflow-hidden"
        style={{
          minHeight: '170px',
          background: 'var(--hub-skeleton-base)',
        }}
      >
        <div className="absolute inset-0 animate-pulse" />
      </div>
    );
  }

  // Empty state - no upcoming game
  if (!nextGame) {
    return (
      <>
        <div 
          className="relative rounded-3xl overflow-hidden cursor-pointer group"
          style={{
            minHeight: '170px',
            background: 'linear-gradient(135deg, var(--hub-glass-bg) 0%, var(--hub-surface) 100%)',
            border: '1px solid var(--hub-stroke)',
            boxShadow: 'var(--hub-shadow-tile)',
          }}
        >
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full py-8 px-6 text-center">
            <h3 
              className="text-[18px] font-semibold mb-1"
              style={{ color: 'var(--hub-text)' }}
            >
              Begin your journey
            </h3>
            <p 
              className="text-[13px] mb-5 max-w-[260px]"
              style={{ color: 'var(--hub-text-sub)' }}
            >
              Find a game nearby or create one and invite friends
            </p>

            {/* CTA buttons */}
            <div className="flex gap-3">
              <button
                onClick={openFindGame}
                className="px-5 py-2.5 rounded-2xl text-[14px] font-medium transition-all"
                style={{
                  background: 'var(--hub-primary-bg)',
                  color: 'var(--hub-primary-text)',
                  border: '1px solid var(--hub-primary-border)',
                }}
              >
                Find a Game
              </button>
              <button
                onClick={openCreateGame}
                className="px-5 py-2.5 rounded-2xl text-[14px] font-medium transition-all"
                style={{
                  background: 'var(--hub-secondary-bg)',
                  color: 'var(--hub-secondary-text)',
                  border: '1px solid var(--hub-secondary-border)',
                }}
              >
                Create Game
              </button>
            </div>
          </div>
        </div>

        <HubGamesHubSheet
          isOpen={gamesHubOpen}
          onClose={() => setGamesHubOpen(false)}
          initialTab={gamesHubInitialTab}
        />
      </>
    );
  }

  // With upcoming game - show hero with course image
  const courseName = nextGame.course?.name || nextGame.courseName || 'Course TBD';
  const courseLocation = nextGame.course 
    ? [nextGame.course.region, nextGame.course.country].filter(Boolean).join(', ')
    : null;
  const slotsLabel = `${nextGame.slotsTotal - nextGame.slotsOpen}/${nextGame.slotsTotal} players`;

  return (
    <>
      <div 
        className="relative rounded-3xl overflow-hidden cursor-pointer group"
        style={{
          minHeight: '170px',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
        }}
        onClick={openViewGame}
      >
        {/* Background image with fade-in */}
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt={courseName}
            className="w-full h-full object-cover transition-opacity duration-500"
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
        </div>

        {/* Gradient overlay for text legibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-end h-full p-5">
          {/* What's up next label */}
          <span 
            className="text-[11px] font-medium uppercase tracking-wider mb-1"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            What's up next
          </span>

          {/* Course name */}
          <h3 
            className="text-[22px] font-semibold leading-tight mb-1 line-clamp-1"
            style={{ color: '#fff' }}
          >
            {courseName}
          </h3>

          {/* Meta row - date, location, slots */}
          <div className="flex items-center gap-4 text-[13px] flex-wrap" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatGameDate(nextGame.startTimeISO)}
            </span>
            {courseLocation && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {courseLocation}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {slotsLabel}
            </span>
          </div>

          {/* View game arrow indicator */}
          <div 
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab={gamesHubInitialTab}
      />
    </>
  );
}
