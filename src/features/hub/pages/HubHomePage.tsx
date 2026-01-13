/**
 * Hub Home Page - Golf OS Dashboard
 * Normal page layout with time-of-day theming
 * Uses GlobalBottomNavigation (rendered at app level)
 */

import React, { useEffect } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHubTimeOfDay } from '../home/hooks/useHubTimeOfDay';

// Hub components
import { HubHeaderToday } from '../home/tiles/HubHeaderToday';
import { UpNextHeroTile } from '../home/tiles/UpNextHeroTile';
import { HubMessagesCard } from '../home/tiles/HubMessagesCard';
import { ActiveGamesNearYouTile } from '../home/tiles/ActiveGamesNearYouTile';
import { EchoTile } from '../home/tiles/EchoTile';
import { YourGamesGradientCTA } from '../home/tiles/YourGamesGradientCTA';
import { HubContentSkeleton } from '../home/tiles/HubContentSkeleton';
import { useHubDataReady } from '../home/hooks/useHubDataReady';

import '../home/hubThemeLight.css';

export function HubHomePage() {
  const isDataReady = useHubDataReady();
  const timeOfDayTheme = useHubTimeOfDay();
  
  useJoinRequestNotifications();

  // Track Hub open
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  return (
    <div 
      className="min-h-screen flex flex-col pb-24"
      style={{
        background: timeOfDayTheme.bg,
      }}
    >
      {/* Content */}
      <div 
        className="flex-1 flex flex-col"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        }}
      >
        <div className="px-5 flex flex-col gap-[8px] flex-1 min-h-0">
          {/* Show skeleton while loading, real content when ready */}
          {!isDataReady ? (
            <HubContentSkeleton />
          ) : (
            <>
              {/* Zone 1: Header - Greeting + Right Button */}
              <HubHeaderToday />

              {/* Zone 2: What's Up Next Hero Tile */}
              <UpNextHeroTile />

              {/* Zone 3: Messages Card */}
              <HubMessagesCard />

              {/* Zone 4: 2-up Grid - Active Games + Echo (fixed height) */}
              <div className="grid grid-cols-2 gap-[8px]">
                <ActiveGamesNearYouTile />
                <EchoTile />
              </div>

              {/* Zone 5: Full-width "Your Games" Gradient CTA */}
              <div className="flex-1 min-h-0">
                <YourGamesGradientCTA className="h-full" />
              </div>
            </>
          )}
        </div>
      </div>
      {/* GlobalBottomNavigation is rendered at app level */}
    </div>
  );
}
