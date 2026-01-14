/**
 * HubWhatsHappeningV3 - "WHAT'S HAPPENING" section
 * Shows active games near user with compact card style
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
          className="h-20 rounded-[20px] animate-pulse"
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
            icon={<MapPin className="h-4 w-4" style={{ color: 'var(--hub-text-dim)' }} />}
            title="No active games nearby"
            subtitle="Create one to be the first"
            onClick={() => setCreateOpen(true)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {displayGames.map((game) => {
              const slotsLabel = `${(game.slots_total || 0) - (game.slots_open || 0)}/${game.slots_total || 0}`;
              
              return (
                <HubCompactCardV3
                  key={game.id}
                  icon={<MapPin className="h-4 w-4" style={{ color: 'var(--hub-badge-green-text)' }} />}
                  iconBg="var(--hub-badge-green-bg)"
                  title={game.course_name || 'Golf Course'}
                  subtitle={formatShortDate(game.start_time)}
                  rightPill={{ text: slotsLabel, variant: 'success' }}
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
