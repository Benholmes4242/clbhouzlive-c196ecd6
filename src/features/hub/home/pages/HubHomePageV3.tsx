/**
 * HubHomePageV3 - Polished Hub Page with Echo Color Scheme
 * Features: #F8FAFC background, green accents, toggle bar, premium cards
 */

import { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';

// V3 Components
import { HubHeaderRowV3 } from '../tiles/v3/HubHeaderRowV3';
import { HubHeroCardV3 } from '../tiles/v3/HubHeroCardV3';
import { HubToggleBar } from '../tiles/v3/HubToggleBar';
import { HubSkeletonV3 } from '../tiles/v3/HubSkeletonV3';
import { HubEmptyState } from '../tiles/v3/HubEmptyState';
import { HubYourWorldV3 } from '../tiles/v3/HubYourWorldV3';

// Sheet components
import { HubMessagesSheet } from '../../components/HubMessagesSheet';
import { HubEchoSheet } from '../../components/HubEchoSheet';
import { CreateGameTripSheetV2 } from '../../components/create-game-trip-v2';
import { DiscoverGamesBottomSheetV2 } from '../../components/discover-games';
import { YourGamesTripsSheetV2 } from '../../components/your-games-trips-v2';

// Data hooks
import { useHubDataReady } from '../hooks/useHubDataReady';
import { useHubHeroDataV3 } from '../hooks/useHubHeroDataV3';

import '../hubThemeLight.css';

type ToggleKey = 'messages' | 'echo' | 'create';

export function HubHomePageV3() {
  const isDataReady = useHubDataReady();
  const { data: heroData, isLoading: heroLoading } = useHubHeroDataV3();

  useJoinRequestNotifications();

  // Sheet states
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [gamesTripsOpen, setGamesTripsOpen] = useState(false);

  // Toggle bar state - "echo" is default selected
  const [activeToggle, setActiveToggle] = useState<ToggleKey | null>('echo');

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
            <div className="flex flex-col gap-6">
              {/* What's Happening Section - Two tiles side by side */}
              <div className="px-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-500">
                    What's Happening
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Games & Trips Tile */}
                  <button
                    onClick={handleOpenGamesTrips}
                    className="flex items-center gap-3 transition-all active:scale-[0.98] bg-white rounded-[14px] border border-slate-200 shadow-sm p-3"
                  >
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                      style={{ background: 'rgba(59, 130, 246, 0.15)' }}
                    >
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-[14px] text-slate-800 truncate">Games & Trips</div>
                      <div className="text-[12px] text-slate-500">Your schedule</div>
                    </div>
                  </button>

                  {/* Discover Games Tile */}
                  <button
                    onClick={handleDiscover}
                    className="flex items-center gap-3 transition-all active:scale-[0.98] bg-white rounded-[14px] border border-slate-200 shadow-sm p-3"
                  >
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                      style={{ background: 'rgba(34, 197, 94, 0.15)' }}
                    >
                      <Search className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-[14px] text-slate-800 truncate">Discover</div>
                      <div className="text-[12px] text-slate-500">Find & join</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Your World Section - has its own header */}
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
