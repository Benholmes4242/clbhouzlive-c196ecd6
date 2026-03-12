/**
 * AppleHUDOverlay - Complete Apple-style HUD combining capsule, progress, and rail
 * Part of the Apple-style Clubhouse redesign
 */

import React from 'react';
import { AppleMetadataCapsule } from './AppleMetadataCapsule';
import { AppleEngagementRail } from './AppleEngagementRail';
import { cn } from '@/lib/utils';

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
  videoProgress?: number; // 0-100
  shouldAnimate?: boolean;
  
  // Handlers
  onProfileSheetOpen?: () => void;
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
const AppleHUDOverlayBase = ({
  videoRef,
  user,
  caption,
  createdAt,
  tags,
  stats,
  isLiked = false,
  isVideo = false,
  isMuted = false,
  isActive = false,
  videoProgress = 0,
  shouldAnimate = false,
  onProfileSheetOpen,
  onMoreClick,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  accentColor = '#ffffff'
}: AppleHUDOverlayProps) => {
  const HUD_BOTTOM = 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height, 72px) + 16px)';

  return (
    <>
      {/* Bottom-left: metadata capsule + progress bar */}
      <div 
        className={cn(
          'clubhouse-hud fixed left-[12px] z-[50]',
          shouldAnimate && 'transition-all duration-motion-fast ease-out-soft',
          shouldAnimate && 'will-change-transform will-change-opacity',
          'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
          isActive
            ? 'opacity-100 translate-y-0'
            : shouldAnimate
              ? 'opacity-0 translate-y-[3px]'
              : 'opacity-100 translate-y-0',
          !isActive && 'pointer-events-none',
          isActive && 'pointer-events-auto'
        )}
        data-active={isActive ? 'true' : 'false'}
      >
        <div className="flex flex-col gap-2 w-[260px] max-w-[80vw]">
          <AppleMetadataCapsule
            user={user}
            caption={caption}
            createdAt={createdAt}
            onProfileSheetOpen={onProfileSheetOpen}
            onMoreClick={onMoreClick}
          />
        </div>
      </div>

      {/* Right-side engagement rail */}
      <AppleEngagementRail
        stats={stats}
        isLiked={isLiked}
        isVideo={isVideo}
        isMuted={isMuted}
        isActive={isActive}
        shouldAnimate={shouldAnimate}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onMuteToggle={onMuteToggle}
        bottom={HUD_BOTTOM}
      />
    </>
  );
};

export const AppleHUDOverlay = React.memo(
  AppleHUDOverlayBase,
  (prev, next) => {
    // Only re-render when relevant props change
    return (
      prev.isActive === next.isActive &&
      prev.shouldAnimate === next.shouldAnimate &&
      prev.caption === next.caption &&
      prev.videoProgress === next.videoProgress &&
      prev.isMuted === next.isMuted &&
      prev.isLiked === next.isLiked &&
      prev.stats.likes === next.stats.likes &&
      prev.stats.comments === next.stats.comments &&
      prev.stats.shares === next.stats.shares
    );
  }
);

AppleHUDOverlay.displayName = 'AppleHUDOverlay';
