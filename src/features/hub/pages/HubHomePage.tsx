/**
 * Hub Home Page - Golf OS Dashboard
 * Standard page layout with subtle time-of-day theming
 */

import React, { useEffect } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHubTimeOfDay } from '../home/hooks/useHubTimeOfDay';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';

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
    <PageRoot 
      className="min-h-screen flex flex-col"
      style={{
        // Time-of-day background
        background: timeOfDayTheme.bg,
      }}
    >
      <FadeInContent>
        {/* Main content area - scrollable */}
        <div 
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
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
      </FadeInContent>
    </PageRoot>
  );
}
