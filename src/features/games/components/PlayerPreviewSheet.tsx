/**
 * PlayerPreviewSheet - Lightweight bottom sheet for player preview
 * 
 * Purpose: Quick identity preview without navigation
 * Single tap = quick peek, explicit CTA = full profile
 * 
 * Layout:
 * 1) Handle + Header (avatar left, name + meta right)
 * 2) Quick Stats (2-column tiles: Handicap, Home Club)
 * 3) Primary CTA: "View profile →"
 */
import React from 'react';
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

interface PlayerPreviewSheetProps {
  player: PlayerPreviewData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}

export function PlayerPreviewSheet({
  player,
  isOpen,
  onClose,
  onViewProfile,
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
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (translateY > 80) {
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

  // Build meta line: "HCP 4 · Ardglass GC"
  const metaParts: string[] = [];
  if (player.eg_handicap_index != null) {
    metaParts.push(`HCP ${player.eg_handicap_index}`);
  }
  if (player.home_club) {
    // Shorten "Golf Club" to "GC" if present
    const shortClub = player.home_club.replace(/Golf Club$/i, 'GC').trim();
    metaParts.push(shortClub);
  }
  const metaLine = metaParts.join(' · ');

  return (
    <>
      {/* Backdrop - tap to dismiss */}
      <div 
        className="playerPreviewSheet__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        ref={sheetRef}
        className="playerPreviewSheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${player.display_name || 'Player'} preview`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: translateY > 0 ? `translateY(${translateY}px)` : undefined }}
      >
        {/* Handle bar */}
        <div className="playerPreviewSheet__handle" />

        <div className="playerPreviewSheet__content">
          {/* 1) Header Row: Avatar left, Info right */}
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
              {metaLine && (
                <p className="playerPreviewSheet__meta">{metaLine}</p>
              )}
            </div>
          </div>

          {/* 2) Quick Stats - 2-column tiles */}
          <div className="playerPreviewSheet__stats">
            <div className="playerPreviewSheet__statTile">
              <span className="playerPreviewSheet__statValue">
                {player.eg_handicap_index != null ? player.eg_handicap_index : '—'}
              </span>
              <span className="playerPreviewSheet__statLabel">Handicap</span>
            </div>
            <div className="playerPreviewSheet__statTile">
              <span className="playerPreviewSheet__statValue">
                {player.home_club 
                  ? player.home_club.replace(/Golf Club$/i, 'GC').trim() 
                  : 'Not set'}
              </span>
              <span className="playerPreviewSheet__statLabel">Home club</span>
            </div>
          </div>

          {/* 3) Primary CTA */}
          <button
            className="playerPreviewSheet__cta"
            onClick={handleViewProfile}
            aria-label={`View profile for ${player.display_name || 'player'}`}
          >
            View profile
          </button>
        </div>
      </div>
    </>
  );
}
