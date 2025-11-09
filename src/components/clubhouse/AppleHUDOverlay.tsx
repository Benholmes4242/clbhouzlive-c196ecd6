/**
 * AppleHUDOverlay - Complete Apple-style HUD combining capsule, progress, and rail
 * Part of the Apple-style Clubhouse redesign
 */

import React from 'react';
import { AppleMetadataCapsule } from './AppleMetadataCapsule';
import { AppleProgressBar } from './AppleProgressBar';
import { AppleEngagementRail } from './AppleEngagementRail';

interface AppleHUDOverlayProps {
  // Video ref for progress tracking
  videoRef: React.RefObject<HTMLVideoElement | null>;
  
  // User info
  user: {
    name: string;
    avatar?: string;
    username?: string;
  };
  caption?: string;
  
  // Engagement stats
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  
  // States
  isLiked?: boolean;
  isVideo?: boolean;
  isMuted?: boolean;
  isActive?: boolean;
  
  // Handlers
  onUserClick?: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMuteToggle?: () => void;
  
  // Styling
  accentColor?: string;
}

/**
 * Complete HUD overlay for Clubhouse vertical feed
 * Includes metadata capsule, progress bar, and engagement rail
 */
export const AppleHUDOverlay = ({
  videoRef,
  user,
  caption,
  stats,
  isLiked = false,
  isVideo = false,
  isMuted = false,
  isActive = false,
  onUserClick,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  accentColor = '#6e9277'
}: AppleHUDOverlayProps) => {
  return (
    <>
      {/* Bottom-left metadata capsule */}
      <AppleMetadataCapsule
        user={user}
        caption={caption}
        onUserClick={onUserClick}
        isActive={isActive}
      />

      {/* Horizontal progress bar */}
      <AppleProgressBar
        videoRef={videoRef}
        accent={accentColor}
        isActive={isActive}
      />

      {/* Right-side engagement rail */}
      <AppleEngagementRail
        stats={stats}
        isLiked={isLiked}
        isVideo={isVideo}
        isMuted={isMuted}
        isActive={isActive}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onMuteToggle={onMuteToggle}
      />
    </>
  );
};
