import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from './components/GolferRow';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useGameBeacon } from './hooks/useGameBeacon';
import { CreateGameModal } from './components/CreateGameModal';
import { GamesTab } from './GamesTab';
import { YourGamesList } from './components/YourGamesList';
import { useVisibility } from './hooks/useVisibility';
import { useOpenToPlay } from './hooks/useOpenToPlay';
import { useLocationBroadcast } from './hooks/useLocationBroadcast';
import { VisibilitySegmentedControl } from './components/VisibilitySegmentedControl';
import { OpenToPlayButton } from './components/OpenToPlayButton';
import { supabase } from '@/integrations/supabase/client';
import { assertDispatch } from '@/utils/assertDispatch';
import { EVT_GAME_CREATED } from './constants';
import { Z } from '@/config/zIndex';

interface NearbyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NearbyOverlay({ isOpen, onClose }: NearbyOverlayProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const { golfers, isLoading } = useActiveGolfers({ limit: 20 });
  
  const { 
    myBeacon, 
    createBeacon,
    cancelBeacon,
  } = useGameBeacon({});
  
  const { visibilityMode, setVisibilityMode, loading: visibilityLoading } = useVisibility();
  
  // Continuously broadcast location when visibility is active
  useLocationBroadcast();
  
  const [activeTab, setActiveTab] = useState<'golfers' | 'games' | 'your-games'>('golfers');
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [prefilledClub, setPrefilledClub] = useState<{ id: string; name: string } | undefined>();
  const [yourGamesCount, setYourGamesCount] = useState(0);
  const [gamesSessionKey, setGamesSessionKey] = useState(0);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Remount GamesTab on every visit to reset filters
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'games') {
      setGamesSessionKey(k => k + 1);
    }
  }, [activeTab, isOpen]);

  const handleClose = () => {
    analyticsEvents.nearby.opened(golfers.length);
    onClose();
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - pointer events disabled */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: Z.hub,
          backgroundColor: 'rgba(0,0,0,0.65)',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
        }}
      />
      
      {/* Click catcher for close-on-backdrop */}
      <button
        aria-label="close"
        className="fixed inset-0"
        style={{ zIndex: Z.hub }}
        onClick={(e) => {
          // Don't close if clicking inside a filter sheet
          if ((e.target as HTMLElement)?.closest?.('[data-filter-sheet]')) return;
          handleClose();
        }}
      />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-end sm:items-center sm:justify-center animate-fade-in pointer-events-none" style={{ zIndex: Z.hub }}>
        {/* Modal */}
        <div
          ref={overlayRef}
          className="relative w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto"
          style={{
            height: 'calc(100vh - env(safe-area-inset-top))',
            maxHeight: '100vh',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            background: 'rgba(15, 15, 15, 0.75)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-4">
            {/* Title + Close */}
            <div className="grid grid-cols-3 items-center mb-3" style={{ userSelect: 'none' }}>
              {/* Left spacer */}
              <div />
              
              {/* Title */}
              <div className="text-center">
                <h2 className="text-white text-[17px] font-semibold">
                  Nearby Golfers
                </h2>
              </div>
              
              {/* Close button */}
              <div className="flex justify-end">
                <TapButton
                  onPointerDown={handleClose}
                  className="text-white/60 hover:text-white/90 transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </TapButton>
              </div>
            </div>

            {/* Visibility Control */}
            <div className="w-full mb-1">
              <VisibilitySegmentedControl 
                value={visibilityMode}
                onChange={setVisibilityMode}
              />
            </div>

            {/* Open to Play Button */}
            <OpenToPlayButton />
          </div>

          {/* Tabs */}
          <div className="flex px-5 mt-3 border-b border-white/[0.06]">
            <button
              onClick={() => setActiveTab('golfers')}
              className={`flex-1 py-3.5 text-sm font-medium relative transition-all duration-150 ${
                activeTab === 'golfers'
                  ? 'text-white'
                  : 'text-white/55 hover:text-white/75'
              }`}
            >
              Golfers
              {activeTab === 'golfers' && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-white/90 rounded-full transition-all duration-150"
                  style={{ width: '48px' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`flex-1 py-3.5 text-sm font-medium relative transition-all duration-150 ${
                activeTab === 'games'
                  ? 'text-white'
                  : 'text-white/55 hover:text-white/75'
              }`}
            >
              Games
              {activeTab === 'games' && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-white/90 rounded-full transition-all duration-150"
                  style={{ width: '48px' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('your-games')}
              className={`flex-1 py-3.5 text-sm font-medium relative transition-all duration-150 ${
                activeTab === 'your-games'
                  ? 'text-white'
                  : 'text-white/55 hover:text-white/75'
              }`}
            >
              Your Games {yourGamesCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/15 text-white text-xs rounded-full">
                  {yourGamesCount}
                </span>
              )}
              {activeTab === 'your-games' && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-white/90 rounded-full transition-all duration-150"
                  style={{ width: '48px' }}
                />
              )}
            </button>
          </div>

         {/* Scrollable Content */}
        <div 
          className="px-5 pt-4 pb-3 flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {activeTab === 'golfers' ? (
            isLoading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center min-h-[240px]">
                <div className="text-[15px] font-medium text-white/90">Loading active golfers…</div>
                <div className="text-[13px] text-white/60 mt-1">Checking who's nearby</div>
              </div>
            ) : (
              <div className="space-y-2">
                {golfers.map((golfer, index) => (
                  <GolferRow key={golfer.id ?? index} golfer={golfer} index={index} />
                ))}
                
                {golfers.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="text-[13px] text-white/60">No other active golfers nearby</div>
                  </div>
                )}
              </div>
            )
          ) : activeTab === 'games' ? (
            <GamesTab key={gamesSessionKey} onOpenCreate={() => setIsCreateGameOpen(true)} />
          ) : (
            <YourGamesList
              activeTab={activeTab}
              onCancelGame={cancelBeacon}
              onLeaveGame={async (gameId) => {
                // Leave game by removing participant
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await supabase
                  .from('game_participants')
                  .delete()
                  .eq('game_id', gameId)
                  .eq('user_id', user.id);
              }}
              onCountChange={setYourGamesCount}
            />
          )}
        </div>
        </div>
      </div>
      
      {/* Create Game Modal - Rendered outside NearbyOverlay but at higher z-index */}
      {isCreateGameOpen && (
        <CreateGameModal
          isOpen={true}
          onClose={() => {
            setIsCreateGameOpen(false);
            setPrefilledClub(undefined);
          }}
          onCreateBeacon={async (input) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              await assertDispatch(
                EVT_GAME_CREATED,
                () => createBeacon(input),
                (result) => ({ gameId: result?.id, hostUserId: user?.id }),
                700
              );
              await new Promise((r) => setTimeout(r, 150));
              setActiveTab('your-games');
            } finally {
              setIsCreateGameOpen(false);
              setPrefilledClub(undefined);
            }
          }}
          prefilledClub={prefilledClub}
          portalContainer={overlayRef.current}
        />
      )}
    </>
  );
}
