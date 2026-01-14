/**
 * HubWhatsHappeningV3 - "WHAT'S HAPPENING" section
 * Sport-status driven cards with active indicators
 */

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { HubGamesTripsSheet } from '@/features/hub/components/HubGamesTripsSheet';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { HubSectionHeader } from './HubSectionHeader';
import { HubCompactCardV3 } from './HubCompactCardV3';
import { format, isToday, isTomorrow } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_NEARBY_GAMES } from '../../hubDemoConfig';

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, "EEE · h:mm a");
}

export function HubWhatsHappeningV3() {
  const { data: realGames = [], isLoading } = useGamesQuery();
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  
  const allGames = HUB_DEMO_MODE ? MOCK_NEARBY_GAMES : realGames;
  const displayGames = allGames.slice(0, 3); // Show max 3

  const openGamesHub = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <HubSectionHeader title="What's Happening" />
        <div 
          className="h-[82px] rounded-[20px] animate-pulse"
          style={{ background: 'var(--hub-skeleton-base)' }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <HubSectionHeader 
          title="What's Happening" 
          actionLabel={allGames.length > 3 ? "View all" : undefined}
          onAction={allGames.length > 3 ? openGamesHub : undefined}
        />

        {displayGames.length === 0 ? (
          <HubCompactCardV3
            icon={<MapPin className="h-4.5 w-4.5" style={{ color: 'var(--hub-text-dim)' }} />}
            title="No active games nearby"
            subtitle="Create one to be the first"
            onClick={() => setCreateOpen(true)}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayGames.map((game, index) => {
              const filled = (game.slots_total || 0) - (game.slots_open || 0);
              const total = game.slots_total || 0;
              const slotsLabel = `${filled}/${total}`;
              const isAlmostFull = filled >= total - 1;
              const isLive = isToday(new Date(game.start_time));
              
              return (
                <HubCompactCardV3
                  key={game.id}
                  icon={
                    <MapPin 
                      className="h-4.5 w-4.5" 
                      style={{ color: '#10B981' }} 
                    />
                  }
                  iconBg="linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)"
                  title={game.course_name || 'Golf Course'}
                  subtitle={formatShortDate(game.start_time)}
                  rightPill={{ 
                    text: slotsLabel, 
                    variant: isLive ? 'live' : 'success' 
                  }}
                  showDot={isLive || isAlmostFull}
                  dotColor={isLive ? '#EF4444' : '#22C55E'}
                  onClick={openGamesHub}
                />
              );
            })}
          </div>
        )}
      </div>

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
