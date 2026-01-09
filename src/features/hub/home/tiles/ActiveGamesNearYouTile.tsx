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
import { HUB_DEMO_MODE, MOCK_NEARBY_GAMES } from '../hubDemoConfig';

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE · h:mm a");
}

export function ActiveGamesNearYouTile() {
  const { data: realGames = [], isLoading: realLoading } = useGamesQuery();
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  
  // Use demo data when flag is on
  const allGames = HUB_DEMO_MODE ? MOCK_NEARBY_GAMES : realGames;
  const isLoading = HUB_DEMO_MODE ? false : realLoading;
  const gamesCount = allGames.length;
  
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
        className="w-full h-[140px] rounded-[22px] p-4 text-left transition-all active:scale-[0.98] flex flex-col relative"
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
        }}
      >
        {/* Games count badge - top right */}
        {gamesCount > 0 && (
          <div 
            className="absolute top-3 right-3 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{
              background: '#2F7CFF',
              color: 'white',
            }}
          >
            {gamesCount}
          </div>
        )}

        {/* Title - single line with line break */}
        <div 
          className="text-[15px] font-extrabold leading-[1.15]"
          style={{ color: 'var(--hub-text)' }}
        >
          Active Games<br/>Near You
        </div>

        <div className="mt-auto">
          {isLoading ? (
            <div 
              className="h-3 w-20 rounded animate-pulse"
              style={{ background: 'var(--hub-skeleton-base)' }}
            />
          ) : nearbyGame ? (
            <>
              {/* Course name - single line */}
              <div 
                className="text-[11px] leading-tight italic line-clamp-1"
                style={{ color: 'var(--hub-text-dim)' }}
              >
                {nearbyGame.course_name || 'Golf Course'}
              </div>
              
              {/* Date/time - single line, tighter */}
              <div 
                className="flex items-center gap-1 text-[11px] leading-tight mt-0.5"
                style={{ color: 'var(--hub-text-dim)' }}
              >
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="line-clamp-1">{formatShortDate(nearbyGame.start_time)}</span>
              </div>

              {/* Slots pill - pinned at bottom */}
              <div 
                className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold mt-2"
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
              className="text-[11px] leading-tight line-clamp-2"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              No games nearby – create one to be the first.
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
