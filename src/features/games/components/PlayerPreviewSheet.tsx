/**
 * PlayerPreviewSheet - Lightweight bottom sheet for player preview
 * 
 * Shows on avatar tap: photo, name, home club, handicap
 * Single action: "View profile →"
 * Tap outside dismisses
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import './PlayerPreviewSheet.css';

export interface PlayerPreviewData {
  user_id: string | null;
  username?: string | null;
  display_name?: string | null;
  profile_photo_url?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
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
  if (!isOpen || !player) return null;

  const handleViewProfile = () => {
    if (player.user_id) {
      onViewProfile(player.user_id);
    }
  };

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
        className="playerPreviewSheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${player.display_name || 'Player'} preview`}
      >
        <div className="playerPreviewSheet__content">
          {/* Avatar */}
          <div className="playerPreviewSheet__avatar">
            <SquircleAvatar
              size={72}
              src={player.profile_photo_url}
              alt={player.display_name || 'Player'}
              fallback={(player.display_name || 'P').charAt(0).toUpperCase()}
            />
          </div>
          
          {/* Info */}
          <div className="playerPreviewSheet__info">
            <h3 className="playerPreviewSheet__name">
              {player.display_name || 'Unknown Player'}
            </h3>
            
            {player.home_club && (
              <p className="playerPreviewSheet__club">{player.home_club}</p>
            )}
            
            {player.eg_handicap_index != null && (
              <p className="playerPreviewSheet__handicap">
                HCP {player.eg_handicap_index}
              </p>
            )}
          </div>
          
          {/* Action */}
          <button
            className="playerPreviewSheet__viewLink"
            onClick={handleViewProfile}
          >
            View profile
          </button>
        </div>
        
        {/* Handle bar */}
        <div className="playerPreviewSheet__handle" />
      </div>
    </>
  );
}
