/**
 * HubYourWorldV3 - "YOUR WORLD" section
 * Calmer, more premium variant of compact cards
 */

import React, { useState } from 'react';
import { MapPin, Plane, Calendar } from 'lucide-react';
import { useHubHeroDataV3 } from '../../hooks/useHubHeroDataV3';
import { YourGamesTripsSheetV2 } from '@/features/hub/components/your-games-trips-v2';
import { HubSectionHeader } from './HubSectionHeader';
import { HubCompactCardV3 } from './HubCompactCardV3';
import { HubGamesTripsCard } from './HubGamesTripsCard';
import { format, isToday, isTomorrow } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_DIARY_ITEMS } from '../../hubDemoConfig';

function formatGameDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, "EEE d MMM");
}

function formatTripDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${format(start, 'd')}–${format(end, 'd MMM')}`;
}

export function HubYourWorldV3() {
  const { data: heroData, isLoading } = useHubHeroDataV3();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Use mock data in demo mode
  const diaryItems = HUB_DEMO_MODE ? MOCK_DIARY_ITEMS : [];
  
  // Build display items from hero data + any additional items
  const displayItems: Array<{
    type: 'game' | 'trip';
    id: string;
    title: string;
    subtitle: string;
  }> = [];

  // Add from hero data
  if (heroData?.primary?.type === 'game') {
    displayItems.push({
      type: 'game',
      id: heroData.primary.gameId,
      title: heroData.primary.courseName,
      subtitle: formatGameDate(heroData.primary.startTimeISO),
    });
  }
  
  if (heroData?.primary?.type === 'trip') {
    displayItems.push({
      type: 'trip',
      id: heroData.primary.tripId,
      title: heroData.primary.tripName,
      subtitle: formatTripDates(heroData.primary.startDate, heroData.primary.endDate),
    });
  }

  if (heroData?.secondary?.type === 'game') {
    displayItems.push({
      type: 'game',
      id: heroData.secondary.gameId,
      title: heroData.secondary.courseName,
      subtitle: formatGameDate(heroData.secondary.startTimeISO),
    });
  }

  if (heroData?.secondary?.type === 'trip') {
    displayItems.push({
      type: 'trip',
      id: heroData.secondary.tripId,
      title: heroData.secondary.tripName,
      subtitle: formatTripDates(heroData.secondary.startDate, heroData.secondary.endDate),
    });
  }

  // Also use diary items from demo mode
  if (HUB_DEMO_MODE && diaryItems.length > 0) {
    diaryItems.slice(0, 2).forEach((item, i) => {
      displayItems.push({
        type: item.type,
        id: `diary-${i}`,
        title: item.title,
        subtitle: item.subtitle,
      });
    });
  }

  // Deduplicate by title (simple approach)
  const uniqueItems = displayItems.filter((item, index, self) =>
    index === self.findIndex(t => t.title === item.title)
  ).slice(0, 2); // Max 2 items

  const openSheet = () => {
    haptic('light');
    setSheetOpen(true);
  };

  // Count remaining items (for demo, use mock data)
  const gamesCount = HUB_DEMO_MODE ? MOCK_DIARY_ITEMS.filter(i => i.type === 'game').length : 0;
  const tripsCount = HUB_DEMO_MODE ? MOCK_DIARY_ITEMS.filter(i => i.type === 'trip').length : 0;
  const moreGames = Math.max(0, gamesCount - 1);
  const moreTrips = Math.max(0, tripsCount - 1);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <HubSectionHeader title="Your World" />
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
          title="Your World" 
          actionLabel="View all"
          onAction={openSheet}
        />

        {uniqueItems.length === 0 ? (
          <HubCompactCardV3
            icon={<Calendar className="h-4.5 w-4.5" style={{ color: 'var(--hub-text-dim)' }} />}
            title="Your golf diary"
            subtitle="Trips, matches, and games"
            onClick={openSheet}
            calmer
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {uniqueItems.map((item) => (
              <HubCompactCardV3
                key={item.id}
                icon={
                  item.type === 'game' 
                    ? <MapPin className="h-4.5 w-4.5" style={{ color: '#64748B' }} />
                    : <Plane className="h-4.5 w-4.5" style={{ color: '#64748B' }} />
                }
                title={item.title}
                subtitle={item.subtitle}
                onClick={openSheet}
                calmer
              />
            ))}
          </div>
        )}

        <HubGamesTripsCard 
          gamesCount={gamesCount} 
          tripsCount={tripsCount}
          onClick={openSheet}
        />
      </div>

      <YourGamesTripsSheetV2
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
