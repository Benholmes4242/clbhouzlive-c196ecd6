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
import { VisibilitySegmentedControl } from './components/VisibilitySegmentedControl';

interface NearbyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NearbyOverlay({ isOpen, onClose }: NearbyOverlayProps) {
  const { golfers, isLoading } = useActiveGolfers({ limit: 20, mockCount: 0 });
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
  const [prefilledClub, setPrefilledClub] = useState<{ id: string; name: string } | undefined>();

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


  const handleOpenToPlayToggle = () => {
    if (isOpenToPlay) {
      cancelOpen();
    } else {
      activateOpen();
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
          height: '80vh',
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
                <h2 className="text-white text-[18px] font-semibold leading-none whitespace-nowrap">
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

          {/* Row B: Visibility Control + Open to Play */}
          <div className="px-4 py-3 space-y-4">
            {/* Visibility Segmented Control */}
            <div className="w-full">
              <VisibilitySegmentedControl 
                value={visibilityMode}
                onChange={setVisibilityMode}
              />
            </div>

            {/* Open to Play compact pill */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={handleOpenToPlayToggle}
                className={`
                  inline-flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-150 active:scale-[0.98]
                  ${isOpenToPlay 
                    ? 'bg-[rgba(110,146,119,0.22)] border border-[rgba(110,146,119,0.5)] shadow-[0_0_8px_rgba(110,146,119,0.5)] text-white' 
                    : 'bg-white/[0.07] border border-white/[0.18] hover:bg-white/[0.1] text-white/80'
                  }
                `}
              >
                <span className="relative text-[14px]">
                  🏌️‍♂️
                  {isOpenToPlay && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white/20" />
                  )}
                </span>
                <span className="text-[13px] font-semibold">
                  Open to Play
                </span>
                {isOpenToPlay && (
                  <span className="text-[11px] text-white/70">
                    • {remainingText} left
                  </span>
                )}
              </button>
              <div className="text-[12px] text-white/60 text-center">
                Tap to let golfers join up
              </div>
            </div>
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
              onCreateGame={(clubData) => {
                if (clubData) {
                  setPrefilledClub(clubData);
                }
                setIsCreateGameOpen(true);
              }}
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
            await createBeacon(input);
            setIsCreateGameOpen(false);
            setPrefilledClub(undefined);
            setActiveTab('games'); // Show Games tab to see "Your Game"
          }}
          onCancelBeacon={cancelBeacon}
          myBeacon={myBeacon}
          prefilledClub={prefilledClub}
        />
      )}
    </>
  );
}
