/**
 * HubPageNew - Hub Page with 4-tile layout
 * Features: Messages, Create Game, Your Schedule, Echo tiles with frosted glass styling
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';

// V3 Components
import { HubHeaderRowV3 } from '../home/tiles/v3/HubHeaderRowV3';
import { HubHeroCardV3 } from '../home/tiles/v3/HubHeroCardV3';
import { HubSkeletonV3 } from '../home/tiles/v3/HubSkeletonV3';
import { HubYourWorldV3 } from '../home/tiles/v3/HubYourWorldV3';

// Sheet components
import { HubMessagesSheet } from '../components/HubMessagesSheet';
import { HubEchoSheet } from '../components/HubEchoSheet';
import { CreateGameTripSheetV2 } from '../components/create-game-trip-v2';
import { YourGamesTripsSheetV2 } from '../components/your-games-trips-v2';

// Data hooks
import { useHubDataReady } from '../home/hooks/useHubDataReady';
import { useHubHeroDataV3 } from '../home/hooks/useHubHeroDataV3';

import '../home/hubThemeLight.css';

// Frosted glass styles
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.4)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
};

const echoGlassStyle = {
  background: 'rgba(251, 191, 36, 0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(251, 191, 36, 0.3)',
  boxShadow: '0 4px 16px rgba(251, 191, 36, 0.1)',
};

export function HubPageNew() {
  const isDataReady = useHubDataReady();
  const { isLoading: heroLoading } = useHubHeroDataV3();

  useJoinRequestNotifications();

  // Sheet states
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Track Hub open
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  const handleOpenMessages = () => {
    haptic('light');
    setMessagesOpen(true);
  };

  const handleOpenCreate = () => {
    haptic('light');
    setCreateOpen(true);
  };

  const handleOpenSchedule = () => {
    haptic('light');
    setScheduleOpen(true);
  };

  const handleOpenEcho = () => {
    haptic('light');
    setEchoOpen(true);
  };

  // Show skeleton while loading
  if (!isDataReady || heroLoading) {
    return <HubSkeletonV3 />;
  }

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
          <div className="px-5 mb-5">
            <HubHeroCardV3 />
          </div>

          {/* Main Action Tiles - 3 tiles in a row */}
          <div className="px-5 mb-4">
            <div className="grid grid-cols-3 gap-3">
              {/* Messages Tile */}
              <button
                onClick={handleOpenMessages}
                className="flex flex-col items-center justify-center rounded-[16px] p-4 transition-all active:scale-[0.97]"
                style={glassStyle}
              >
                <div 
                  className="flex items-center justify-center w-11 h-11 rounded-xl mb-2"
                  style={{ 
                    background: 'rgba(20, 184, 166, 0.15)',
                    border: '1px solid rgba(20, 184, 166, 0.25)',
                  }}
                >
                  <MessageSquare className="w-5 h-5 text-teal-500" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">Messages</span>
              </button>

              {/* Create Game Tile */}
              <button
                onClick={handleOpenCreate}
                className="flex flex-col items-center justify-center rounded-[16px] p-4 transition-all active:scale-[0.97]"
                style={glassStyle}
              >
                <div 
                  className="flex items-center justify-center w-11 h-11 rounded-xl mb-2"
                  style={{ 
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                  }}
                >
                  <Plus className="w-5 h-5 text-yellow-500" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">Create Game</span>
              </button>

              {/* Your Schedule Tile */}
              <button
                onClick={handleOpenSchedule}
                className="flex flex-col items-center justify-center rounded-[16px] p-4 transition-all active:scale-[0.97]"
                style={glassStyle}
              >
                <div 
                  className="flex items-center justify-center w-11 h-11 rounded-xl mb-2"
                  style={{ 
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                  }}
                >
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">Your Schedule</span>
              </button>
            </div>
          </div>

          {/* Echo Tile - Full width with mascot */}
          <div className="px-5 mb-6">
            <button
              onClick={handleOpenEcho}
              className="w-full flex items-center gap-4 rounded-[16px] p-4 transition-all active:scale-[0.98]"
              style={echoGlassStyle}
            >
              {/* Echo Mascot */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              
              {/* Text */}
              <div className="flex-1 text-left">
                <div className="text-[15px] font-semibold text-amber-900">Hi, I'm Echo</div>
                <div className="text-[13px] text-amber-700/80">Your AI golf caddie — ask me anything</div>
              </div>
              
              {/* Chevron */}
              <ChevronRight className="w-5 h-5 text-amber-600/60 shrink-0" />
            </button>
          </div>

          {/* Your World Section */}
          <div className="px-5">
            <HubYourWorldV3 />
          </div>
        </div>
      </FadeInContent>

      {/* All Sheets */}
      <HubMessagesSheet isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <HubEchoSheet isOpen={echoOpen} onClose={() => setEchoOpen(false)} />
      <CreateGameTripSheetV2 isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <YourGamesTripsSheetV2 isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </PageRoot>
  );
}
