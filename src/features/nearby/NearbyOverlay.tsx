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
        className="fixed inset-0 z-[9999] flex items-end sm:items-center sm:justify-center animate-fade-in"
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
          className="relative w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-4 duration-200"
          style={{
            height: 'calc(100vh - env(safe-area-inset-top))',
            maxHeight: '100vh',
            touchAction: 'auto',
            overscrollBehavior: 'contain',
            background: 'rgba(15, 15, 15, 0)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px 20px 0 0',
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
                <button
                  onClick={handleClose}
                  className="text-white/60 hover:text-white/90 transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visibility Control */}
            <div className="w-full">
              <VisibilitySegmentedControl 
                value={visibilityMode}
                onChange={setVisibilityMode}
              />
            </div>

            {/* Divider */}
            <div className="w-full mt-3 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Open to Play toggle pill */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleOpenToPlayToggle}
                className={`
                  relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-semibold text-white
                  transition-all duration-200 active:scale-[0.96]
                  ${isOpenToPlay 
                    ? 'border' 
                    : 'bg-white/[0.07] border border-white/20 hover:bg-white/[0.1]'
                  }
                `}
                style={isOpenToPlay ? {
                  background: 'rgba(110, 146, 119, 0.28)',
                  borderColor: 'rgba(110, 146, 119, 0.5)',
                  boxShadow: '0 0 16px rgba(110, 146, 119, 0.45)',
                } : undefined}
              >
                <span className="relative text-[14px]">
                  🏌
                  {isOpenToPlay && (
                    <span 
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full border border-white/30 animate-in fade-in scale-in duration-200" 
                    />
                  )}
                </span>
                <span className="text-[13px]">
                  Open to Play
                </span>
                {isOpenToPlay && remainingText && (
                  <span className="text-[11px] text-white/70">
                    • {remainingText}
                  </span>
                )}
              </button>
              <div className="text-[13px] text-white/60 text-center max-w-[260px] leading-relaxed">
                Tap to let golfers know you're up for a game
              </div>
            </div>
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
              Games {nearbyBeacons.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/15 text-white text-xs rounded-full">
                  {nearbyBeacons.length}
                </span>
              )}
              {activeTab === 'games' && (
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
            ) : golfers.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center min-h-[240px]">
                <div className="text-[15px] font-medium text-white/90">No active golfers right now</div>
                <div className="text-[13px] text-white/60 mt-1">Check back soon</div>
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
