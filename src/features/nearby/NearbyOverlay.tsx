import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from './components/GolferRow';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useGameBeacon } from './hooks/useGameBeacon';
import { CreateGameModal } from './components/CreateGameModal';
import { GamesNearbyList } from './components/GamesNearbyList';
import { useVisibility } from './hooks/useVisibility';
import { useOpenToPlay } from './hooks/useOpenToPlay';

interface NearbyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NearbyOverlay({ isOpen, onClose }: NearbyOverlayProps) {
  const { golfers, isLoading } = useActiveGolfers({ limit: 20, mockCount: 5 });
  const { 
    myBeacon, 
    nearbyBeacons, 
    isLoading: beaconsLoading,
    createBeacon,
    cancelBeacon,
    joinBeacon,
  } = useGameBeacon();
  const { visibilityMode, setVisibilityMode, loading: visibilityLoading } = useVisibility();
  const { isOpen: isOpenToPlay, remainingText, activate: activateOpen, cancel: cancelOpen } = useOpenToPlay();
  
  const [activeTab, setActiveTab] = useState<'golfers' | 'games'>('golfers');
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);

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

  const handleClose = () => {
    analyticsEvents.nearby.opened(golfers.length);
    onClose();
  };

  const cycleVisibility = () => {
    if (visibilityMode === 'all') {
      setVisibilityMode('friends');
    } else if (visibilityMode === 'friends') {
      setVisibilityMode('hidden');
    } else {
      setVisibilityMode('all');
    }
  };

  const handleOpenToPlayToggle = () => {
    if (isOpenToPlay) {
      cancelOpen();
    } else {
      activateOpen();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center sm:justify-center"
      style={{
        backgroundColor: 'rgba(0,0,0,0.4)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
      onClick={handleClose}
    >
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{
          maxHeight: '80vh',
          touchAction: 'auto',
          overscrollBehavior: 'contain',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-neutral-800/60">
          {/* Row A: Title + Close */}
          <header className="px-4 pt-4 pb-3" style={{ userSelect: 'none' }}>
            <div className="grid grid-cols-3 items-center">
              {/* Left spacer */}
              <div />
              
              {/* Title */}
              <div className="text-center">
                <h2 className="text-white text-[18px] font-semibold leading-none">
                  Nearby Golfers
                </h2>
              </div>
              
              {/* Close button */}
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="text-white/70 active:scale-95 transition-transform"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Row B: 2-card grid (Visibility + Open to Play) */}
          <div className="grid grid-cols-2 gap-2 px-4 py-4">
            {/* Visibility card */}
            <button
              onClick={cycleVisibility}
              disabled={visibilityLoading}
              className="flex flex-col items-center justify-center text-center rounded-xl px-4 py-3 backdrop-blur"
              style={{
                minHeight: '110px',
                flex: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.12) inset',
              }}
            >
              <div className="text-white/70 text-[13px] font-medium mb-1.5">
                Visibility
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: visibilityMode === 'hidden' ? '#666' : '#22c55e',
                  }}
                />
                <span className="text-white text-base font-medium leading-tight">
                  {visibilityMode === 'all' && 'Everyone'}
                  {visibilityMode === 'friends' && 'Friends'}
                  {visibilityMode === 'hidden' && 'Hidden'}
                </span>
              </div>
              <div className="text-white/50 text-[12px] leading-snug max-w-[220px]">
                Choose your visibility to other golfers
              </div>
            </button>

            {/* Open to Play card */}
            <button
              onClick={handleOpenToPlayToggle}
              className="flex flex-col items-center justify-center text-center rounded-xl px-4 py-3 backdrop-blur"
              style={{
                minHeight: '110px',
                flex: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.12) inset',
              }}
            >
              <div className="text-white/70 text-[13px] font-medium mb-1.5">
                Open to Play
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                {isOpenToPlay ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-white text-base font-medium leading-tight">
                      Open to Play
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
                    <span className="text-white text-base font-medium leading-tight">
                      Tap to ping
                    </span>
                  </>
                )}
              </div>
              <div className="text-white/50 text-[12px] leading-snug max-w-[220px]">
                {isOpenToPlay
                  ? `${remainingText} left · Tap to stop`
                  : "Tell golfers you're free to join up"}
              </div>
            </button>
          </div>

          {/* Row C: Tabs */}
          <div className="flex px-4">
            <button
              onClick={() => setActiveTab('golfers')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                activeTab === 'golfers'
                  ? 'border-white/90 text-white/90'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              Golfers
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                activeTab === 'games'
                  ? 'border-white/90 text-white/90'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              Games {nearbyBeacons.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/15 text-white text-xs rounded-full">
                  {nearbyBeacons.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="px-4 pt-4 pb-3 flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {activeTab === 'golfers' ? (
            isLoading ? (
              <div className="py-12 text-center text-sm text-neutral-500">
                <div className="font-medium text-neutral-300">Loading active golfers…</div>
                <div className="text-neutral-500">Checking who's nearby</div>
              </div>
            ) : golfers.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-500">
                <div className="font-medium text-neutral-300">No active golfers right now</div>
                <div className="text-neutral-500">Check back soon</div>
              </div>
            ) : (
              <div className="space-y-2">
                {golfers.map((golfer, index) => (
                  <GolferRow key={golfer.id ?? index} golfer={golfer} index={index} />
                ))}
              </div>
            )
          ) : (
            <GamesNearbyList
              beacons={nearbyBeacons}
              isLoading={beaconsLoading}
              onJoinBeacon={joinBeacon}
              onCancelBeacon={cancelBeacon}
              onCreateGame={() => setIsCreateGameOpen(true)}
            />
          )}
        </div>
      </div>
      
      {/* Create Game Modal */}
      <CreateGameModal
        isOpen={isCreateGameOpen}
        onClose={() => setIsCreateGameOpen(false)}
        onCreateBeacon={createBeacon}
        onCancelBeacon={cancelBeacon}
        myBeacon={myBeacon}
      />
    </div>
  );
}
