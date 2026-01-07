/**
 * PlayerPreviewSheet - Lightweight bottom sheet for player preview
 * 
 * V1 Snap Points (height buckets):
 * - Small phones (<700px): 48%
 * - Standard (700-820px): 44%
 * - Large (>820px): 40%
 * 
 * Always opens with handle visible, respects safe areas
 * Smooth content switching when tapping different avatars
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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

/**
 * Calculate snap point based on device height
 * Small phones: 48%, Standard: 44%, Large: 40%
 */
function getSnapHeight(windowHeight: number): number {
  if (windowHeight < 700) {
    return 0.48; // Small phones
  } else if (windowHeight <= 820) {
    return 0.44; // Standard phones
  } else {
    return 0.40; // Large phones
  }
}

/**
 * Get safe area insets
 */
function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10) || 0,
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10) || 0,
  };
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
  // Calculate snap height based on window size
  const [windowHeight, setWindowHeight] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  
  // Handle swipe down to dismiss
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Update window height on resize
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate sheet height
  const sheetConfig = useMemo(() => {
    const snapRatio = getSnapHeight(windowHeight);
    const safeArea = getSafeAreaInsets();
    const snapHeight = Math.round(windowHeight * snapRatio);
    
    // Clamp: ensure sheet top is never above safeAreaTop + 8px
    const maxSheetHeight = windowHeight - safeArea.top - 8;
    const clampedHeight = Math.min(snapHeight, maxSheetHeight);
    
    // Minimum height to fit content
    const minHeight = 280;
    const finalHeight = Math.max(clampedHeight, minHeight);
    
    return {
      height: finalHeight,
      bottomPadding: safeArea.bottom + 12,
    };
  }, [windowHeight]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    // Only allow downward swipe
    if (diff > 0) {
      setTranslateY(diff);
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (translateY > 60) {
      // Animate out then close
      setIsAnimatingOut(true);
      setTimeout(() => {
        onClose();
        setIsAnimatingOut(false);
      }, 200);
    }
    setTranslateY(0);
    setTouchStart(null);
  }, [translateY, onClose]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setTranslateY(0);
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClose();
      setIsAnimatingOut(false);
    }, 180);
  }, [onClose]);

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

  // Calculate transform for swipe + animate out
  const sheetTransform = isAnimatingOut 
    ? 'translateY(100%)' 
    : translateY > 0 
      ? `translateY(${translateY}px)` 
      : undefined;

  return (
    <>
      {/* Backdrop - tap to dismiss */}
      <div 
        className={`playerPreviewSheet__backdrop ${isAnimatingOut ? 'playerPreviewSheet__backdrop--out' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Sheet - fixed snap height */}
      <div 
        className={`playerPreviewSheet ${isAnimatingOut ? 'playerPreviewSheet--out' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${player.display_name || 'Player'} preview`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          height: sheetConfig.height,
          paddingBottom: sheetConfig.bottomPadding,
          transform: sheetTransform,
          opacity: translateY > 0 ? Math.max(0.6, 1 - translateY / 200) : 1,
        }}
      >
        {/* Header bar with handle and close button - always visible */}
        <div className="playerPreviewSheet__headerBar">
          <div className="playerPreviewSheet__handle" />
          <button 
            className="playerPreviewSheet__closeBtn"
            onClick={handleClose}
            aria-label="Close preview"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Content wrapper with key for crossfade transitions */}
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
