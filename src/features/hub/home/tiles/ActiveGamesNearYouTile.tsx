/**
 * ActiveGamesNearYouTile V2 - Premium tile for 2-up grid
 * Matching heights, consistent radius, V2 icon styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { HubGamesTripsSheet } from '@/features/hub/components/HubGamesTripsSheet';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { haptic } from '@/utils/haptics';
import { format, isToday, isTomorrow } from 'date-fns';
import { HUB_DEMO_MODE, MOCK_NEARBY_GAMES } from '../hubDemoConfig';

const CAROUSEL_INTERVAL = 4000;

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE · h:mm a");
}

export function ActiveGamesNearYouTile() {
  const { data: realGames = [], isLoading: realLoading } = useGamesQuery();
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const allGames = HUB_DEMO_MODE ? MOCK_NEARBY_GAMES : realGames;
  const isLoading = HUB_DEMO_MODE ? false : realLoading;
  const gamesCount = allGames.length;
  const hasCarousel = gamesCount >= 2;
  
  const nearbyGame = allGames[activeIndex] || allGames[0];

  const advanceCarousel = useCallback(() => {
    if (!hasCarousel) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % gamesCount);
      setIsTransitioning(false);
    }, 150);
  }, [hasCarousel, gamesCount]);

  useEffect(() => {
    if (!hasCarousel) return;
    const interval = setInterval(advanceCarousel, CAROUSEL_INTERVAL);
    return () => clearInterval(interval);
  }, [hasCarousel, advanceCarousel]);

  const openGamesHub = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  const slotsLabel = nearbyGame 
    ? `${(nearbyGame.slots_total || 0) - (nearbyGame.slots_open || 0)}/${nearbyGame.slots_total || 0}`
    : '0/0';

  return (
    <>
      <button
        onClick={openGamesHub}
        className="w-full h-[140px] rounded-[18px] p-4 text-left transition-all duration-150 active:scale-[0.99] flex flex-col relative overflow-hidden"
        style={{
          background: 'var(--hub-card)',
          border: '1px solid var(--hub-card-border)',
          boxShadow: 'var(--hub-shadow-soft)', // Soft shadow for secondary tile
        }}
      >
        {/* V2 Top icon - rounded square background */}
        <div 
          className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-2"
          style={{ background: 'var(--hub-badge-green-bg)' }}
        >
          <MapPin className="w-4 h-4" style={{ color: 'var(--hub-badge-green-text)' }} />
        </div>

        {/* Title - V2 typography polish */}
        <div 
          className="text-[14px] font-semibold"
          style={{ 
            color: 'var(--hub-text)',
            lineHeight: '1.1',
            letterSpacing: '-0.2px',
          }}
        >
          Active Games<br/>Near You
        </div>

        {/* V2 Badge - top right, soft pill style */}
        {gamesCount > 0 && (
          <div 
            className="absolute top-3 right-3 h-5 min-w-[20px] px-2 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              background: 'var(--hub-badge-green-bg)',
              color: 'var(--hub-badge-green-text)',
              border: '1px solid var(--hub-badge-green-border)',
            }}
          >
            {gamesCount}
          </div>
        )}

        <div className="mt-auto">
          {isLoading ? (
            <div 
              className="h-3 w-20 rounded animate-pulse"
              style={{ background: 'var(--hub-skeleton-base)' }}
            />
          ) : nearbyGame ? (
            <div
              className="transition-opacity duration-150"
              style={{ opacity: isTransitioning ? 0 : 1 }}
            >
              {/* Course name */}
              <div 
                className="text-[11px] leading-tight line-clamp-1"
                style={{ color: 'var(--hub-text-dim)' }}
              >
                {nearbyGame.course_name || 'Golf Course'}
              </div>
              
              {/* Date/time */}
              <div 
                className="text-[11px] leading-tight mt-0.5"
                style={{ color: 'var(--hub-text-dimmer)' }}
              >
                {formatShortDate(nearbyGame.start_time)}
              </div>

              {/* V2 Mini progress pill - matches Create Sheet chips */}
              <div 
                className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold mt-1.5"
                style={{
                  background: 'rgba(15, 23, 42, 0.04)',
                  color: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {slotsLabel}
              </div>
            </div>
          ) : (
            <div 
              className="text-[11px] leading-tight line-clamp-2"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              No games nearby – create one to be the first.
            </div>
          )}
        </div>

        {/* Carousel dots */}
        {hasCarousel && (
          <div className="absolute bottom-3 right-3 flex gap-0.5">
            {allGames.map((_, idx) => (
              <div
                key={idx}
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === activeIndex ? '8px' : '4px',
                  height: '4px',
                  background: idx === activeIndex 
                    ? 'var(--hub-badge-green-text)' 
                    : 'var(--hub-badge-green-bg)',
                }}
              />
            ))}
          </div>
        )}

        {/* V2 Subtle accent bar at bottom */}
        <div 
          className="absolute bottom-0 left-4 right-4 rounded-full"
          style={{
            height: '3px',
            background: 'var(--hub-badge-green-text)',
            opacity: 0.35,
          }}
        />
      </button>

      <HubGamesTripsSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        onOpenCreate={() => setCreateOpen(true)}
      />

      <CreateGameTripSheetV2
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
