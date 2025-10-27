import React, { useEffect, useState } from 'react';
import { X, MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { VisibilityToggle } from './components/VisibilityToggle';
import { RequestGameSheet, RequestGamePayload } from './components/RequestGameSheet';
import { useVisibility } from './hooks/useVisibility';
import { useGameBeacon } from './hooks/useGameBeacon';
import { OpenToPlayButton } from './components/OpenToPlayButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import AvatarSquircle from '@/components/ui/AvatarSquircle';

interface NearbyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NearbyOverlay({ isOpen, onClose }: NearbyOverlayProps) {
  const { golfers, isLoading } = useActiveGolfers({ limit: 20, mockCount: 5 });
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
                Active Golfers
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
          ) : (
            <div className="space-y-2">
              {golfers.map((golfer, index) => (
                <GolferRow key={golfer.id} golfer={golfer} index={index} />
              ))}
            </div>
          )}
          {golfers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No active golfers right now
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Check back soon
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
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--accent-frost-hover)]"
                  style={{
                    backgroundColor: 'var(--accent-frost-bg)',
                    color: 'var(--accent-frost-text)',
                    border: '1px solid var(--accent-frost-border)',
                  }}
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
                className="w-full h-12 font-bold rounded-xl transition-colors hover:bg-[var(--accent-frost-hover)]"
                onClick={() => {
                  analyticsEvents.track('beacon_open_composer');
                  setShowComposer(true);
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
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
  golfer: {
    id: string;
    display_name: string;
    username?: string;
    home_club?: string;
    avatar_url?: string;
    is_online: boolean;
    isMock: boolean;
    distanceText?: string;
    isOpenToPlay?: boolean;
  };
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

  return (
    <article
      className="rounded-2xl px-4 py-3 mb-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        border: '1px solid var(--border-low)',
      }}
      aria-label={`${golfer.display_name}, ${golfer.home_club || 'No home club'}`}
    >
      <div className="grid grid-cols-[56px_1fr] gap-3 items-center">
        {/* Avatar - spans 3 rows */}
        <div className="row-span-3 relative">
          <AvatarSquircle
            size={56}
            src={golfer.avatar_url || '/placeholder.svg'}
            alt={golfer.display_name}
          >
            {golfer.is_online && !golfer.isMock && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{ background: '#6e9277', borderColor: '#1a1a1a' }}
                aria-label="Online"
              />
            )}
          </AvatarSquircle>
        </div>

        {/* Row 1: Name */}
        <div className="flex items-center justify-between min-w-0 gap-2">
          <h3 className="font-semibold text-[16px] truncate" style={{ color: 'var(--text-primary)' }}>
            {golfer.display_name}
          </h3>
        </div>

        {/* Row 2: Distance + Club */}
        <div className="flex items-center gap-2 min-w-0">
          {!golfer.isMock && golfer.distanceText && (
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {golfer.distanceText}
            </span>
          )}
          {golfer.home_club && (
            <p className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {golfer.home_club}
            </p>
          )}
          {!golfer.isMock && golfer.isOpenToPlay && (
            <span className="text-xs" style={{ color: '#6e9277' }}>
              🟢 Open to play
            </span>
          )}
        </div>

        {/* Row 3: Follow/Message buttons (Open to Play hidden for Phase 1) */}
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFollow}
              className="h-7 px-3 text-xs font-semibold rounded-md transition-colors hover:bg-[var(--accent-frost-hover)]"
              style={{
                backgroundColor: 'var(--accent-frost-bg)',
                color: 'var(--accent-frost-text)',
                border: '1px solid var(--accent-frost-border)',
              }}
              aria-pressed={isFollowing}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={handleMessage}
              className="h-7 px-3 text-xs font-semibold rounded-md transition-colors hover:bg-[var(--accent-frost-hover)]"
              style={{
                backgroundColor: 'var(--accent-frost-bg)',
                color: 'var(--accent-frost-text)',
                border: '1px solid var(--accent-frost-border)',
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
