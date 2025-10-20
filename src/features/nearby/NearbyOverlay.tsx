import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NearbyGolfer } from './types';
import { useNearbyGolfers } from './useNearbyGolfers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { VisibilityToggle } from './components/VisibilityToggle';
import { RequestGameSheet, RequestGamePayload } from './components/RequestGameSheet';
import { useVisibility } from './hooks/useVisibility';
import { useGameBeacon } from './hooks/useGameBeacon';
import { OpenToPlayButton } from './components/OpenToPlayButton';

interface NearbyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NearbyOverlay({ isOpen, onClose }: NearbyOverlayProps) {
  const { data: golfers = [], isLoading } = useNearbyGolfers();
  const { visible, setVisible } = useVisibility();
  const { activeBeacon, createBeacon, cancelBeacon } = useGameBeacon();
  const [showComposer, setShowComposer] = useState(false);
  const [filterOpenToPlay, setFilterOpenToPlay] = useState(false);

  const handleCreateBeacon = async (payload: RequestGamePayload) => {
    // Convert new payload format to old beacon format
    await createBeacon({
      when: 'now',
      whereClubId: payload.club_id,
      playersNeeded: payload.players_needed,
      formats: [payload.format.replace('_', '') as any],
      notes: payload.notes,
      audience: payload.audience === 'all' ? 'nearby' : payload.audience,
      visibilityWindowMin: 120,
      sendPush: payload.push,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (showComposer) {
        setShowComposer(false);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleBackdropClick = (e: MouseEvent) => {
      if (!showComposer && (e.target as HTMLElement).classList.contains('nearby-overlay-backdrop')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleBackdropClick);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleBackdropClick);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, showComposer]);

  useEffect(() => {
    if (isOpen && golfers.length > 0) {
      analyticsEvents.track('nearby_opened', { count: golfers.length });
    }
  }, [isOpen, golfers.length]);

  // Filter golfers based on Open to Play status
  const visibleGolfers = filterOpenToPlay
    ? golfers.filter((g) => g.isOpenToPlay === true)
    : golfers;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="nearby-overlay-backdrop fixed inset-0 flex items-center justify-center p-4"
      style={{
        background: 'rgba(18, 18, 18, 0.32)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 'var(--z-nearby-overlay)',
        pointerEvents: showComposer ? 'none' : 'auto',
      }}
    >
      <div 
        className="nearby-overlay-sheet w-full max-w-[440px] md:max-w-[640px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(255, 255, 255, 0.86)',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
          zIndex: 'calc(var(--z-nearby-overlay) + 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 border-b border-black/10" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
          <h2 id="nearby-title" className="text-[17px] font-semibold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            Players near you
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer" title="See golfers currently looking for a game">
              <input
                type="checkbox"
                checked={filterOpenToPlay}
                onChange={(e) => {
                  setFilterOpenToPlay(e.target.checked);
                  analyticsEvents.track('open2play_filter_toggle', { enabled: e.target.checked });
                }}
                className="w-4 h-4 rounded accent-[#6e9277]"
              />
              <span className="text-xs font-medium" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                Open to Play
              </span>
            </label>
            <VisibilityToggle value={visible} onChange={setVisible} />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-black/5">
                  <div className="w-12 h-12 rounded-2xl bg-black/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-black/10 rounded w-1/3" />
                    <div className="h-3 bg-black/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleGolfers.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(0, 0, 0, 0.3)' }} />
              <p className="font-medium mb-2" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                {filterOpenToPlay ? 'No golfers open to play right now' : 'No golfers nearby right now'}
              </p>
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                {filterOpenToPlay ? 'Try turning off the filter' : 'Check again later'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleGolfers.map((golfer, index) => (
                <GolferRow key={golfer.id} golfer={golfer} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Active Beacon Summary */}
        {activeBeacon && (
          <div className="px-4 py-3 border-b border-black/10" style={{ background: 'rgba(110, 146, 119, 0.1)' }}>
            <div className="text-sm font-medium mb-2" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              Beacon sent — {activeBeacon.playersNeeded} player{activeBeacon.playersNeeded > 1 ? 's' : ''} notified
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowComposer(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={{ background: 'rgba(255, 255, 255, 0.9)', color: 'rgba(0, 0, 0, 0.88)' }}
              >
                Manage beacon
              </button>
              <button
                onClick={() => cancelBeacon(activeBeacon.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={{ color: '#dc2626' }}
              >
                Cancel beacon
              </button>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        {golfers.length > 0 && (
          <div className="p-4 border-t border-black/10 space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                analyticsEvents.track('beacon_open_composer');
                setShowComposer(true);
              }}
              style={{ background: '#6e9277', color: 'white' }}
            >
              Create game
            </Button>
            <div className="flex justify-center">
              <OpenToPlayButton />
            </div>
          </div>
        )}
      </div>

      {/* Request Game Sheet */}
      <RequestGameSheet
        open={showComposer}
        onClose={() => setShowComposer(false)}
        defaultAudience="nearby"
        defaultWhen="now"
        onSubmit={handleCreateBeacon}
      />
    </div>,
    document.body
  );
}

interface GolferRowProps {
  golfer: NearbyGolfer;
  index: number;
}

function GolferRow({ golfer, index }: GolferRowProps) {
  const [isFollowing, setIsFollowing] = React.useState(false);

  const handleFollow = () => {
    analyticsEvents.track('nearby_follow_clicked', { golfer_id: golfer.id, position: index });
    setIsFollowing(!isFollowing);
    // TODO: Call follow mutation
  };

  const handleMessage = () => {
    analyticsEvents.track('nearby_message_clicked', { golfer_id: golfer.id, position: index });
    // TODO: Open message composer
    console.log('Message clicked for', golfer.display_name);
  };

  const distanceText = golfer.distance_km 
    ? golfer.distance_km < 1.6 
      ? `${(golfer.distance_km * 0.621371).toFixed(1)} mi`
      : `${golfer.distance_km.toFixed(1)} km`
    : null;

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-sm active:scale-[0.98]"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={golfer.avatar_url || '/placeholder.svg'}
          alt={golfer.display_name}
          className="w-12 h-12 rounded-2xl object-cover"
        />
        {golfer.is_online && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: '#6e9277' }}
            aria-label="Online"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] mb-0.5" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
          {golfer.display_name}
        </div>
        {golfer.home_club && (
          <div className="text-[13px] mb-1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            {golfer.home_club}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {golfer.isOpenToPlay && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ 
                background: '#6e9277',
                color: 'white'
              }}
            >
              🟢 Open to Play
            </span>
          )}
          {distanceText && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ 
                background: 'rgba(0, 0, 0, 0.08)',
                color: 'rgba(0, 0, 0, 0.7)'
              }}
            >
              <MapPin className="w-3 h-3" />
              {distanceText}
            </span>
          )}
          {golfer.same_club && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ 
                background: 'rgba(110, 146, 119, 0.2)',
                color: '#6e9277'
              }}
            >
              <Home className="w-3 h-3" />
              Same home club
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant={isFollowing ? 'outline' : 'default'}
          onClick={handleFollow}
          className="h-7 px-3 text-xs font-bold"
          style={!isFollowing ? { 
            background: '#6e9277',
            color: 'white',
            border: 'none'
          } : {
            borderColor: '#6e9277',
            color: '#6e9277'
          }}
          aria-pressed={isFollowing}
        >
          {isFollowing ? 'Following ✓' : 'Follow'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleMessage}
          className="h-7 px-3 text-xs"
          style={{
            borderColor: '#6e9277',
            color: '#6e9277'
          }}
        >
          Message
        </Button>
      </div>
    </div>
  );
}
