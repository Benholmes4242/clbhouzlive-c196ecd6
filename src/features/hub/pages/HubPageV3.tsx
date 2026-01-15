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

  // Check if there's any user-created content (games or trips) - not fallback
  const hasUpcomingContent = heroData?.primary !== undefined && heroData?.primary !== null;
  
  // Check if we have games or trips specifically (not just fallback course)
  const hasGamesOrTrips = heroData?.primary?.type === 'game' || heroData?.primary?.type === 'trip' ||
                          heroData?.secondary?.type === 'game' || heroData?.secondary?.type === 'trip';

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
          {!hasUpcomingContent ? (
            <HubEmptyState onCreateGame={handleCreateGame} onDiscover={handleDiscover} />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Quick Tiles - Always show when we have hero content */}
              <div className="px-5 flex flex-col gap-3">
                {/* Your Games & Trips Tile */}
                <button
                  onClick={handleOpenGamesTrips}
                  className="flex items-center gap-4 w-full text-left transition-all active:scale-[0.99] bg-white rounded-[14px] border border-slate-200 shadow-sm"
                  style={{ padding: '18px 16px' }}
                >
                  <div 
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl"
                    style={{ background: 'rgba(59, 130, 246, 0.15)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] text-slate-800">Your Games & Trips</div>
                    <div className="text-[13px] mt-0.5 text-slate-500">
                      {(() => {
                        const games = heroData?.primary?.type === 'game' ? 1 : (heroData?.secondary?.type === 'game' ? 1 : 0);
                        const trips = heroData?.primary?.type === 'trip' ? 1 : (heroData?.secondary?.type === 'trip' ? 1 : 0);
                        const parts: string[] = [];
                        if (games > 0) parts.push(`${games} game`);
                        if (trips > 0) parts.push(`${trips} trip`);
                        return parts.length > 0 ? parts.join(' · ') + ' upcoming' : 'View your upcoming events';
                      })()}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>

                {/* Discover Games Tile */}
                <button
                  onClick={handleDiscover}
                  className="flex items-center gap-4 w-full text-left transition-all active:scale-[0.99] bg-white rounded-[14px] border border-slate-200 shadow-sm"
                  style={{ padding: '18px 16px' }}
                >
                  <div 
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl"
                    style={{ background: 'rgba(34, 197, 94, 0.15)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] text-slate-800">Discover Games</div>
                    <div className="text-[13px] mt-0.5 text-slate-500">Find games near you to join</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>

              {/* What's Happening Section */}
              <div className="px-5">
                <HubWhatsHappeningV3 />
              </div>

              {/* Your World Section */}
              <div className="px-5">
                <HubYourWorldV3 />
              </div>
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
