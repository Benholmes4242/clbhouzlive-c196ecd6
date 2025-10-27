import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { GolferRow } from './components/GolferRow';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useGameBeacon } from './hooks/useGameBeacon';
import { CreateGameModal } from './components/CreateGameModal';
import { GamesNearbyList } from './components/GamesNearbyList';
import { useVisibility } from './hooks/useVisibility';

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
  const { visible, setVisible, loading: visibilityLoading } = useVisibility();
  
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
    analyticsEvents.nearby.opened(golfers.length); // Track close as a re-open event
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center sm:justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-neutral-900/95 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="border-b border-neutral-800/60">
          <div className="flex items-center justify-between px-4 py-4">
            <h2 className="text-lg font-semibold text-neutral-100">
              Nearby
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateGameOpen(true)}
                className="p-2 rounded-full bg-white/8 hover:bg-white/12 active:bg-white/12 backdrop-blur border border-white/22 transition-all shadow-[0_16px_32px_rgba(0,0,0,0.9),_0_0_18px_rgba(255,255,255,0.18)_inset] active:shadow-[0_20px_40px_rgba(0,0,0,0.9),_0_0_24px_rgba(255,255,255,0.24)_inset]"
                title="Create a game"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-neutral-800/60 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
          </div>
          
          {/* Availability Toggle */}
          <div className="px-4 pb-3">
            <button
              onClick={() => setVisible(!visible)}
              disabled={visibilityLoading}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur border transition-all ${
                visible
                  ? 'bg-white/8 border-white/22 text-white/90'
                  : 'bg-white/3 border-white/14 text-white/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${visible ? 'bg-green-400' : 'bg-white/40'}`} />
              <span className="text-xs font-medium">
                {visible ? 'Visible to nearby golfers' : 'Hidden from nearby golfers'}
              </span>
            </button>
          </div>
          
          {/* Tabs */}
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
        <div className="px-4 pt-4 pb-3 grow overflow-y-auto overscroll-contain">
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
