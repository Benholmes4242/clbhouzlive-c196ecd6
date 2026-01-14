/**
 * Hub Home Page - Golf OS Dashboard
 * Full page layout matching standard pages (like Golf Courses)
 */

import React, { useEffect } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
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
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      <FadeInContent>
        <main className="px-4 pb-[30px]">
          <div className="flex flex-col gap-[8px]">
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

                {/* Zone 4: 2-up Grid - Active Games + Echo */}
                <div className="grid grid-cols-2 gap-[8px]">
                  <ActiveGamesNearYouTile />
                  <EchoTile />
                </div>

                {/* Zone 5: Full-width "Your Games" Gradient CTA */}
                <YourGamesGradientCTA className="min-h-[120px]" />
              </>
            )}
          </div>
        </main>
      </FadeInContent>
    </PageRoot>
  );
}
