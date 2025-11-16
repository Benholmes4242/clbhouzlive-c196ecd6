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
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  };
  caption?: string;
  createdAt?: string;
  courseName?: string;
  tags?: string[];
  
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
  onMoreClick?: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMuteToggle?: () => void;
  
  // Styling
  accentColor?: string;
}

/**
 * Complete HUD overlay for Clubhouse vertical feed
 * Includes metadata capsule, progress bar (integrated), and engagement rail
 */
export const AppleHUDOverlay = ({
  videoRef,
  user,
  caption,
  createdAt,
  courseName,
  tags,
  stats,
  isLiked = false,
  isVideo = false,
  isMuted = false,
  isActive = false,
  onUserClick,
  onMoreClick,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  accentColor = '#6e9277'
}: AppleHUDOverlayProps) => {
  return (
    <>
      {/* Bottom-left: metadata capsule + progress bar */}
      <div
        className="fixed left-[16px] z-[50] flex flex-col gap-2"
        style={{
          bottom: `calc(env(safe-area-inset-bottom) + var(--bottom-nav-height, 72px) + 22px)`,
        }}
      >
        <AppleMetadataCapsule
          user={user}
          caption={caption}
          createdAt={createdAt}
          courseName={courseName}
          tags={tags}
          onUserClick={onUserClick}
          onMoreClick={onMoreClick}
          isActive={isActive}
        />
        
        <AppleProgressBar
          videoRef={videoRef}
          accent={accentColor}
          isActive={isActive}
        />
      </div>

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
