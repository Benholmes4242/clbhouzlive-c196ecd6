/**
 * ActiveGamesNearYouTile - Compact tile for 2-up grid
 * Shows nearby game info with slots pill
 */

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';
import { format, isToday, isTomorrow } from 'date-fns';

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE · h:mm a");
}

export function ActiveGamesNearYouTile() {
  const { data: allGames = [], isLoading } = useGamesQuery();
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  
  // Get the first nearby game
  const nearbyGame = allGames[0];

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
        className="w-full h-full rounded-[22px] p-4 text-left transition-all active:scale-[0.98] flex flex-col"
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
        }}
      >
        {/* Title - two lines */}
        <div 
          className="text-[16px] font-extrabold leading-tight"
          style={{ color: 'var(--hub-text)' }}
        >
          Active Games<br/>Near You
        </div>

        <div className="mt-auto">
          {isLoading ? (
            <div 
              className="h-4 w-24 rounded animate-pulse mt-2"
              style={{ background: 'var(--hub-skeleton-base)' }}
            />
          ) : nearbyGame ? (
            <>
              {/* Course name */}
              <div 
                className="text-[13px] mt-2 italic truncate"
                style={{ color: 'var(--hub-text-dim)' }}
              >
                {nearbyGame.course_name || 'Golf Course'}
              </div>
              
              {/* Date/time */}
              <div 
                className="flex items-center gap-1 text-[13px] mt-1"
                style={{ color: 'var(--hub-text-dim)' }}
              >
                <MapPin className="w-3 h-3" />
                {formatShortDate(nearbyGame.start_time)}
              </div>

              {/* Slots pill */}
              <div 
                className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[13px] font-semibold mt-3"
                style={{
                  background: 'var(--hub-glass-bg-input)',
                  color: '#2F7CFF',
                }}
              >
                {slotsLabel}
              </div>
            </>
          ) : (
            <div 
              className="text-[13px] mt-2"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              No games nearby
            </div>
          )}
        </div>
      </button>

      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab="discover"
      />
    </>
  );
}
