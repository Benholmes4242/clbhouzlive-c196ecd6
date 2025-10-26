import React, { useEffect, useState } from 'react';
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
import { BottomSheet } from '@/components/ui/BottomSheet';

interface NearbyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NearbyOverlay({ isOpen, onClose }: NearbyOverlayProps) {
  const { data: golfers = [], isLoading } = useNearbyGolfers();
  const { visible, setVisible } = useVisibility();
  const { activeBeacon, createBeacon, cancelBeacon } = useGameBeacon();
  const [showComposer, setShowComposer] = useState(false);

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

  // Close Golfers sheet when Request sheet closes if needed
  const handleRequestClose = () => {
    setShowComposer(false);
  };

  useEffect(() => {
    if (isOpen && golfers.length > 0) {
      analyticsEvents.track('nearby_opened', { count: golfers.length });
    }
  }, [isOpen, golfers.length]);

  return (
    <>
      <BottomSheet open={isOpen} onClose={onClose} zIndexBase={1400} ariaLabelledBy="nearby-title">
        <div className={`max-h-[78vh] flex flex-col ${showComposer ? 'sheet-dim' : ''}`}>
          {/* Header */}
          <div className="flex items-start justify-between border-b shrink-0" style={{ padding: '12px 20px', borderColor: 'var(--border-mid)' }}>
            <div className="flex items-center gap-3">
              <h2 id="nearby-title" className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Golfers near you
              </h2>
              <VisibilityToggle value={visible} onChange={setVisible} />
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-overlay)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="px-4 pt-4 pb-3 grow overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="w-12 h-12 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded w-1/3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : golfers.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No golfers nearby right now
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Check again later
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {golfers.map((golfer, index) => (
                <GolferRow key={golfer.id} golfer={golfer} index={index} />
              ))}
            </div>
          )}
          </div>

          {/* Active Beacon Summary */}
          {activeBeacon && (
            <div className="flex items-start justify-between" style={{ backgroundColor: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-mid)', padding: '12px 16px' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                You're currently "Open to Play"
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowComposer(true)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-low)' }}
                >
                  Manage beacon
                </button>
                <button
                  onClick={() => cancelBeacon(activeBeacon.id)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-red-400"
                  style={{ backgroundColor: 'transparent', border: '1px solid rgba(244,63,94,0.4)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sticky Footer */}
          {golfers.length > 0 && (
            <footer
              className="sticky bottom-0 space-y-3 shrink-0"
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderTop: '1px solid var(--border-mid)',
                padding: '12px 16px 16px',
              }}
            >
              <button
                className="w-full h-12 font-bold rounded-xl"
                onClick={() => {
                  analyticsEvents.track('beacon_open_composer');
                  setShowComposer(true);
                }}
                style={{ backgroundColor: 'var(--accent-green-bg)', color: 'var(--accent-green-text)' }}
              >
                Create game
              </button>
              <div className="flex justify-center">
                <OpenToPlayButton />
              </div>
            </footer>
          )}
        </div>
      </BottomSheet>

      {/* Request Game Sheet - stacked above */}
      <RequestGameSheet
        open={showComposer}
        onClose={handleRequestClose}
        defaultAudience="nearby"
        defaultWhen="now"
        onSubmit={handleCreateBeacon}
      />
    </>
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
    <article
      className="rounded-2xl px-4 py-3 mb-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        border: '1px solid var(--border-low)',
      }}
      aria-label={`${golfer.display_name}, ${golfer.home_club || 'No home club'}, ${distanceText || 'Distance unknown'}`}
    >
      <div className="grid grid-cols-[56px_1fr] gap-3 items-center">
        {/* Avatar - spans 3 rows */}
        <div className="row-span-3 relative">
          <img
            src={golfer.avatar_url || '/placeholder.svg'}
            alt={golfer.display_name}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          {golfer.is_online && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: '#6e9277', borderColor: '#1a1a1a' }}
              aria-label="Online"
            />
          )}
        </div>

        {/* Row 1: Name + Distance */}
        <div className="flex items-center justify-between min-w-0 gap-2">
          <h3 className="font-semibold text-[16px] truncate" style={{ color: 'var(--text-primary)' }}>
            {golfer.display_name}
          </h3>
          {distanceText && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
              style={{ 
                background: 'var(--pill-inactive-bg)',
                color: 'var(--pill-inactive-text)'
              }}
            >
              <MapPin className="w-3 h-3" />
              {distanceText}
            </span>
          )}
        </div>

        {/* Row 2: Club + Same home club pill */}
        <div className="flex items-center justify-between min-w-0 gap-2">
          {golfer.home_club && (
            <p className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {golfer.home_club}
            </p>
          )}
          {golfer.same_club && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
              style={{ 
                backgroundColor: 'rgba(110,146,119,0.16)',
                border: '1px solid rgba(110,146,119,0.4)',
                color: 'var(--accent-green-bg)'
              }}
            >
              <Home className="w-3 h-3" />
              Same home club
            </span>
          )}
        </div>

        {/* Row 3: Open to Play pill + Follow/Message buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center">
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
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFollow}
              className="h-7 px-3 text-xs font-semibold rounded-md"
              style={!isFollowing ? { 
                backgroundColor: 'var(--accent-green-bg)',
                color: 'var(--accent-green-text)',
                border: '1px solid var(--accent-green-bg)'
              } : {
                backgroundColor: 'transparent',
                color: 'var(--accent-green-bg)',
                border: '1px solid var(--accent-green-bg)'
              }}
              aria-pressed={isFollowing}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={handleMessage}
              className="h-7 px-3 text-xs font-semibold rounded-md"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--accent-green-bg)',
                border: '1px solid var(--accent-green-bg)'
              }}
            >
              Message
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
