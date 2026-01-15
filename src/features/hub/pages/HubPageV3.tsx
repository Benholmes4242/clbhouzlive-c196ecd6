/**
 * HubPageV3 - Polished Hub Page with Echo Color Scheme
 * Features: Loading skeleton, empty states, premium cards, state-based sheets
 */

import { useState, useEffect } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';

// V3 Components
import {
  HubHeaderRowV3,
  HubHeroCardV3,
  HubToggleBar,
  HubSkeletonV3,
  HubEmptyState,
  HubQuickTiles,
} from '../home/tiles/v3';

// Sections with their own data fetching
import { HubWhatsHappeningV3 } from '../home/tiles/v3/HubWhatsHappeningV3';
import { HubYourWorldV3 } from '../home/tiles/v3/HubYourWorldV3';

// Sheet components
import { HubMessagesSheet } from '../components/HubMessagesSheet';
import { HubEchoSheet } from '../components/HubEchoSheet';
import { CreateGameTripSheetV2 } from '../components/create-game-trip-v2';
import { DiscoverGamesBottomSheetV2 } from '../components/discover-games';
import { YourGamesTripsSheetV2 } from '../components/your-games-trips-v2';

// Data hooks
import { useHubDataReady } from '../home/hooks/useHubDataReady';
import { useHubHeroDataV3 } from '../home/hooks/useHubHeroDataV3';

import '../home/hubThemeLight.css';

type ToggleKey = 'messages' | 'echo' | 'create';

export function HubPageV3() {
  const isDataReady = useHubDataReady();
  const { data: heroData, isLoading: heroLoading } = useHubHeroDataV3();

  useJoinRequestNotifications();

  // Sheet states
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [gamesTripsOpen, setGamesTripsOpen] = useState(false);

  // Toggle bar state - null means no selection (reset after action)
  const [activeToggle, setActiveToggle] = useState<ToggleKey | null>(null);

  // Track Hub open
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  const handleToggleAction = (key: ToggleKey) => {
    setActiveToggle(key);
    haptic('light');

    // Small delay for visual feedback before opening sheet
    setTimeout(() => {
      switch (key) {
        case 'messages':
          setMessagesOpen(true);
          break;
        case 'echo':
          setEchoOpen(true);
          break;
        case 'create':
          setCreateOpen(true);
          break;
      }
      // Reset toggle after sheet opens
      setTimeout(() => setActiveToggle(null), 300);
    }, 100);
  };

  // Handle empty state actions
  const handleCreateGame = () => {
    haptic('light');
    setCreateOpen(true);
  };

  const handleDiscover = () => {
    haptic('light');
    setDiscoverOpen(true);
  };

  const handleOpenGamesTrips = () => {
    haptic('light');
    setGamesTripsOpen(true);
  };

  // Show skeleton while loading
  if (!isDataReady || heroLoading) {
    return <HubSkeletonV3 />;
  }

  // Check if there's any content at all
  const hasHeroContent = heroData?.primary !== undefined;

  return (
    <PageRoot
      className="min-h-screen flex flex-col"
      style={{
        background: '#F8FAFC',
      }}
    >
      <FadeInContent>
        {/* Main content area */}
        <div
          className="flex-1 flex flex-col"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Header - Greeting + Avatar */}
          <HubHeaderRowV3 />

          {/* Hero Card */}
          <div className="px-5 mb-4">
            <HubHeroCardV3 />
          </div>

          {/* Toggle Bar - Messages/Echo/Create */}
          <div className="mb-6">
            <HubToggleBar activeToggle={activeToggle} onToggle={handleToggleAction} />
          </div>

          {/* Content Sections or Empty State */}
          {!hasHeroContent ? (
            <HubEmptyState onCreateGame={handleCreateGame} onDiscover={handleDiscover} />
          ) : (
            <div className="flex flex-col gap-6 px-5">
              {/* Quick Tiles - Games & Trips / Discover */}
              <HubQuickTiles
                gamesCount={heroData?.primary?.type === 'game' ? 1 : (heroData?.secondary?.type === 'game' ? 1 : 0)}
                tripsCount={heroData?.primary?.type === 'trip' ? 1 : (heroData?.secondary?.type === 'trip' ? 1 : 0)}
                onOpenGamesTrips={handleOpenGamesTrips}
                onOpenDiscover={handleDiscover}
              />

              {/* What's Happening Section - has its own header */}
              <HubWhatsHappeningV3 />

              {/* Your World Section - has its own header */}
              <HubYourWorldV3 />
            </div>
          )}
        </div>
      </FadeInContent>

      {/* All Sheets - State-based rendering */}
      <HubMessagesSheet isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <HubEchoSheet isOpen={echoOpen} onClose={() => setEchoOpen(false)} />
      <CreateGameTripSheetV2 isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <DiscoverGamesBottomSheetV2 isOpen={discoverOpen} onClose={() => setDiscoverOpen(false)} />
      <YourGamesTripsSheetV2 isOpen={gamesTripsOpen} onClose={() => setGamesTripsOpen(false)} />
    </PageRoot>
  );
}
