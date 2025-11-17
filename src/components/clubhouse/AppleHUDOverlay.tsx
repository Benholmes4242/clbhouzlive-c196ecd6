/**
 * AppleHUDOverlay - Complete Apple-style HUD combining capsule, progress, and rail
 * Part of the Apple-style Clubhouse redesign
 * 
 * Z-index: 40 (clubhouseHud) - See src/constants/zIndex.ts for full hierarchy
 */

import React from 'react';
import { AppleMetadataCapsule } from './AppleMetadataCapsule';
import { AppleEngagementRail } from './AppleEngagementRail';
import { AppleProgressBar } from './AppleProgressBar';

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
  courseRating?: number;
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
  
  // Handlers
  onProfileSheetOpen?: () => void;
  onCourseClick?: () => void;
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
  courseRating,
  tags,
  stats,
  isLiked = false,
  isVideo = false,
  isMuted = false,
  isActive = false,
  videoProgress = 0,
  onProfileSheetOpen,
  onCourseClick,
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
      <div className="clubhouse-hud fixed left-[12px] z-[40]">
        <div className="flex flex-col gap-2 w-[260px] max-w-[80vw]">
          <AppleMetadataCapsule
            user={user}
            caption={caption}
            createdAt={createdAt}
            courseName={courseName}
            courseRating={courseRating}
            onProfileSheetOpen={onProfileSheetOpen}
            onCourseClick={onCourseClick}
            onMoreClick={onMoreClick}
          />
          <div className="px-4">
            <AppleProgressBar progress={videoProgress} />
          </div>
        </div>
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
        bottom={HUD_BOTTOM}
      />
    </>
  );
};
