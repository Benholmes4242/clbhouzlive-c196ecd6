/**
 * AppleHUDOverlay - Complete Apple-style HUD combining capsule, progress, and rail
 * Part of the Apple-style Clubhouse redesign
 */

import React from 'react';
import { AppleMetadataCapsule } from './AppleMetadataCapsule';
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
  onProfileSheetOpen,
  onCourseClick,
  onMoreClick,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  accentColor = '#ffffff'
}: AppleHUDOverlayProps) => {
  return (
    <>
      {/* Bottom-left: metadata capsule */}
      <div
        className="fixed left-[12px] z-[50]"
        style={{
          bottom: `calc(env(safe-area-inset-bottom) + var(--bottom-nav-height, 72px) + 16px)`,
        }}
      >
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
