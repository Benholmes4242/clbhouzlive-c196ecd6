/**
 * PlayerPreviewSheet - Lightweight bottom sheet for player preview
 * 
 * Fixed positioning: Proper snap point (~42% height), safe areas respected
 * Close affordances: Swipe down, tap outside, X button always visible
 * Smooth switching: Content crossfades when switching users
 */
import React from 'react';
import { X } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import './PlayerPreviewSheet.css';

export interface PlayerPreviewData {
  user_id: string | null;
  username?: string | null;
  display_name?: string | null;
  profile_photo_url?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  role?: 'host' | 'player';
}

type SheetState = 'loading' | 'loaded' | 'error';

interface PlayerPreviewSheetProps {
  player: PlayerPreviewData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
  state?: SheetState;
  onRetry?: () => void;
  isCurrentUser?: boolean;
  /** Key to trigger content transition animation */
  contentKey?: string;
}

export function PlayerPreviewSheet({
  player,
  isOpen,
  onClose,
  onViewProfile,
  state = 'loaded',
  onRetry,
  isCurrentUser = false,
  contentKey,
}: PlayerPreviewSheetProps) {
  // Handle swipe down to dismiss
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [translateY, setTranslateY] = React.useState(0);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    // Only allow downward swipe
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (translateY > 60) {
      onClose();
    }
    setTranslateY(0);
    setTouchStart(null);
  };

  // Reset translate when closed
  React.useEffect(() => {
    if (!isOpen) {
      setTranslateY(0);
    }
  }, [isOpen]);

  if (!isOpen || !player) return null;

  const handleViewProfile = () => {
    if (player.user_id) {
      onViewProfile(player.user_id);
    }
  };

  // Build meta line with fallbacks
  const hasHandicap = player.eg_handicap_index != null;
  const hasClub = !!player.home_club;
  
  let metaLine: string;
  if (hasHandicap && hasClub) {
    const shortClub = player.home_club!.replace(/Golf Club$/i, 'GC').trim();
    metaLine = `HCP ${player.eg_handicap_index} · ${shortClub}`;
  } else if (hasHandicap) {
    metaLine = `HCP ${player.eg_handicap_index}`;
  } else if (hasClub) {
    metaLine = player.home_club!.replace(/Golf Club$/i, 'GC').trim();
  } else {
    metaLine = 'Details not set yet';
  }

  const metaIsMissing = !hasHandicap && !hasClub;

  return (
    <>
      {/* Backdrop - tap to dismiss */}
      <div 
        className="playerPreviewSheet__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet - fixed height snap point */}
      <div 
        ref={sheetRef}
        className="playerPreviewSheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${player.display_name || 'Player'} preview`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          opacity: translateY > 0 ? Math.max(0.5, 1 - translateY / 200) : 1,
        }}
      >
        {/* Header bar with handle and close button */}
        <div className="playerPreviewSheet__headerBar">
          <div className="playerPreviewSheet__handle" />
          <button 
            className="playerPreviewSheet__closeBtn"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Content wrapper with key for transitions */}
        <div 
          key={contentKey || player.user_id || 'default'} 
          className="playerPreviewSheet__contentWrapper"
        >
          {/* Loading State - Skeleton */}
          {state === 'loading' && (
            <div className="playerPreviewSheet__content playerPreviewSheet__content--skeleton">
              <div className="playerPreviewSheet__header">
                <div className="playerPreviewSheet__avatar">
                  <div className="skeleton skeleton--avatar" />
                </div>
                <div className="playerPreviewSheet__headerInfo">
                  <div className="skeleton skeleton--name" />
                  <div className="skeleton skeleton--meta" />
                </div>
              </div>

              <div className="playerPreviewSheet__stats">
                <div className="playerPreviewSheet__statTile">
                  <div className="skeleton skeleton--statValue" />
                  <div className="skeleton skeleton--statLabel" />
                </div>
                <div className="playerPreviewSheet__statTile">
                  <div className="skeleton skeleton--statValue" />
                  <div className="skeleton skeleton--statLabel" />
                </div>
              </div>

              <div className="skeleton skeleton--cta" />
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="playerPreviewSheet__content playerPreviewSheet__content--error">
              <div className="playerPreviewSheet__header">
                <div className="playerPreviewSheet__avatar">
                  <SquircleAvatar
                    size={56}
                    src={player.profile_photo_url}
                    alt={player.display_name || 'Player'}
                    fallback={(player.display_name || 'P').charAt(0).toUpperCase()}
                  />
                </div>
                <div className="playerPreviewSheet__headerInfo">
                  <h3 className="playerPreviewSheet__name">
                    {player.display_name || 'Unknown Player'}
                  </h3>
                  <p className="playerPreviewSheet__errorText">Couldn't load details</p>
                </div>
              </div>

              {onRetry && (
                <button 
                  className="playerPreviewSheet__retryBtn"
                  onClick={onRetry}
                >
                  Tap to try again
                </button>
              )}

              {player.user_id && (
                <button
                  className="playerPreviewSheet__cta"
                  onClick={handleViewProfile}
                  aria-label={`View profile for ${player.display_name || 'player'}`}
                >
                  View profile
                </button>
              )}
            </div>
          )}

          {/* Loaded State - Full content */}
          {state === 'loaded' && (
            <div className="playerPreviewSheet__content">
              <div className="playerPreviewSheet__header">
                <div className="playerPreviewSheet__avatar">
                  <SquircleAvatar
                    size={56}
                    src={player.profile_photo_url}
                    alt={player.display_name || 'Player'}
                    fallback={(player.display_name || 'P').charAt(0).toUpperCase()}
                  />
                </div>
                
                <div className="playerPreviewSheet__headerInfo">
                  <h3 className="playerPreviewSheet__name">
                    {player.display_name || 'Unknown Player'}
                  </h3>
                  <p className={`playerPreviewSheet__meta ${metaIsMissing ? 'playerPreviewSheet__meta--missing' : ''}`}>
                    {metaLine}
                  </p>
                </div>
              </div>

              <div className="playerPreviewSheet__stats">
                <div className="playerPreviewSheet__statTile">
                  <span className={`playerPreviewSheet__statValue ${!hasHandicap ? 'playerPreviewSheet__statValue--missing' : ''}`}>
                    {hasHandicap ? player.eg_handicap_index : '—'}
                  </span>
                  <span className="playerPreviewSheet__statLabel">Handicap</span>
                </div>
                <div className="playerPreviewSheet__statTile">
                  <span className={`playerPreviewSheet__statValue ${!hasClub ? 'playerPreviewSheet__statValue--missing' : ''}`}>
                    {hasClub 
                      ? player.home_club!.replace(/Golf Club$/i, 'GC').trim() 
                      : 'Not set'}
                  </span>
                  <span className="playerPreviewSheet__statLabel">Home club</span>
                </div>
              </div>

              {isCurrentUser && (!hasHandicap || !hasClub) && (
                <p className="playerPreviewSheet__hint">
                  Add handicap and home club in your profile.
                </p>
              )}

              <button
                className="playerPreviewSheet__cta"
                onClick={handleViewProfile}
                aria-label={`View profile for ${player.display_name || 'player'}`}
              >
                View profile
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
