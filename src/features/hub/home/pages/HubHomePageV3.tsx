/**
 * HubHomePageV3 - Event-Led Hub Layout (Option C)
 * Premium, energetic, LIV-inspired design
 */

import React, { useEffect } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHubTimeOfDay } from '../hooks/useHubTimeOfDay';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';

// V3 Components
import { HubHeaderRowV3 } from '../tiles/v3/HubHeaderRowV3';
import { HubHeroCardV3 } from '../tiles/v3/HubHeroCardV3';
import { HubQuickActionsV3 } from '../tiles/v3/HubQuickActionsV3';
import { HubWhatsHappeningV3 } from '../tiles/v3/HubWhatsHappeningV3';
import { HubYourWorldV3 } from '../tiles/v3/HubYourWorldV3';

import '../hubThemeLight.css';

export function HubHomePageV3() {
  const timeOfDayTheme = useHubTimeOfDay();
  
  useJoinRequestNotifications();

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
      style={{ background: timeOfDayTheme.bg }}
    >
      <FadeInContent>
        <div 
          className="flex-1 flex flex-col"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Header Row - 56px */}
          <HubHeaderRowV3 />

          {/* Main content with 16px horizontal padding */}
          <div className="px-4 flex flex-col gap-3 flex-1">
            {/* Hero Card - 200px */}
            <HubHeroCardV3 />

            {/* Quick Actions - centered pill bar */}
            <HubQuickActionsV3 />

            {/* Section: What's Happening */}
            <HubWhatsHappeningV3 />

            {/* Section: Your World */}
            <HubYourWorldV3 />
          </div>
        </div>
      </FadeInContent>
    </PageRoot>
  );
}
