import React, { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { BreathingRoomBottomBar } from './BreathingRoomBottomBar';
import { FeedActionRail } from './FeedActionRail';
import { Z } from '@/config/zIndex';
import { InlineReviewCard } from './InlineReviewCard';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { formatTimeAgo } from '@/utils/formatTime';
import type { FeedPost } from '@/components/media-system/types/media';
import { useReviewerStats } from '@/hooks/useReviewerStats';

interface FeedOverlayLayerProps {
  posts: FeedPost[];
  onLike: (post: FeedPost) => void;
  onComment: () => void;
  onShare: (post: FeedPost) => void;
  onMore: () => void;
  getLikeState: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount: (post: FeedPost) => number;
  getFollowState: (post: FeedPost) => boolean;
  onFollow: (post: FeedPost) => void;
  onViewProfile: () => void;
  onReviewTap: () => void;
  overlayVisible: boolean;
  isOwnPost: boolean;
  golfCourse?: { id: string; name: string; country?: string } | null;
  onBeforeNavigate?: () => void;
  activeReview?: {
    reviewId: string;
    courseId: string;
    courseName: string;
    courseImageUrl: string | null;
    rating: number;
    courseCountry?: string | null;
    courseRegion?: string | null;
    courseSubCountry?: string | null;
    reviewText?: string | null;
    breakdown?: {
      design: number | null;
      conditions: number | null;
      clubhouse: number | null;
      facilities: number | null;
    } | null;
  } | null;
  isActiveReview?: boolean;
  activeIndexOverride?: number;
  /** Base offset from screen bottom in px. Omit for Clubhouse (respects bottom nav); pass 0 for fullscreen overlay (no nav). */
  bottomOffset?: number;
  /** Read-only mode: hides interactive controls on the action rail (only creator avatar shown). */
  readOnly?: boolean;
}

export const FeedOverlayLayer = memo(function FeedOverlayLayer({
  posts,
  onLike,
  onComment,
  onShare,
  onMore,
  getLikeState,
  getCommentCount,
  getFollowState,
  onFollow,
  onViewProfile,
  onReviewTap,
  overlayVisible,
  isOwnPost,
  golfCourse,
  onBeforeNavigate,
  activeIndexOverride,
  bottomOffset,
  readOnly = false,
}: FeedOverlayLayerProps) {
  const navigate = useNavigate();
  const clubhouseActiveIndex = useClubhouseStore((s) => s.activeIndex);
  const activeIndex = activeIndexOverride ?? clubhouseActiveIndex;
  const activeVideoElement = useClubhouseStore((s) => s.activeVideoElement);
  const isMuted = useClubhouseStore((s) => s.isMuted);
  const toggleMute = useClubhouseStore((s) => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore((s) => s.markUserGestureUnmute);
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);

  const handleToggleMute = useCallback(() => {
    if (isMuted) markUserGestureUnmute();
    toggleMute();
  }, [isMuted, markUserGestureUnmute, toggleMute]);

  const activePost = posts[activeIndex] ?? null;
  const isTournamentCardActive = useClubhouseStore((s) => s.isTournamentCardActive);

  const [captionExpanded, setCaptionExpanded] = useState(false);

  useEffect(() => {
    setCaptionExpanded(false);
  }, [activePost?.id]);

  if (!activePost) return null;

  // Hide overlays on editorial and tournament cards (they have their own chrome).
  // Also hide while a sentinel reports an editorial card is in view, which fires
  // earlier than activeIndex during snap-scroll — kills mid-swipe chrome bleed.
  const isEditorialCard = (
    activePost.postType === 'tournament_result' ||
    activePost.postType === 'pga_card' ||
    activePost.postType === 'course_of_week_card'
  );
  if (isEditorialCard || isTournamentCardActive) return null;

  const likeState = getLikeState(activePost);
  const commentCount = getCommentCount(activePost);
  const isFollowed = getFollowState(activePost);
  // Read the currently-viewed media index for this post so the rail reflects
  // the active slide (photo vs video), not just the first media item.
  const activeMediaIndex = carouselPositions.get(activeIndex) ?? 0;
  const isVideo = activePost.mediaItems?.[activeMediaIndex]?.type === 'video';

  const tags = activePost.tags ?? [];

  // Action rail creator — same data as bottom-bar author, slightly different shape
  const creator = {
    id: activePost.userId,
    avatarUrl: activePost.avatarUrl,
    displayName: activePost.displayName,
  };

  const author = {
    id: activePost.userId,
    displayName: activePost.displayName,
    avatarUrl: activePost.avatarUrl,
    handicapIndex: activePost.handicapIndex ?? null,
    homeClub: activePost.homeClub ?? null,
    timeAgoLabel: activePost.createdAt ? formatTimeAgo(activePost.createdAt, 'short') : '',
  };

  const handleCourseTap = () => {
    if (!golfCourse) return;
    onBeforeNavigate?.();
    navigate(`/courses/${golfCourse.id}`);
  };

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 30,
        pointerEvents: 'none',
        opacity: overlayVisible ? 1 : 0,
        transition: 'opacity 0.18s ease',
      }}
    >
      {/* Mute toggle now lives inside FeedActionRail (top of rail) */}

      {/* Inline Review Card — renders in the bottom slot for review posts */}
      {activePost.isReview && activePost.review && (
        <ReviewOverlaySlot
          activePost={activePost}
          overlayVisible={overlayVisible}
          bottomOffset={bottomOffset}
          onReviewTap={onReviewTap}
        />
      )}

      {/* Bottom-left content slot (regular posts) — author + caption + course pill.
          Hidden for review posts via isReview. */}
      <BreathingRoomBottomBar
        caption={activePost.isReview ? '' : activePost.caption ?? ''}
        tags={activePost.isReview ? [] : tags}
        isVisible={overlayVisible}
        postId={activePost.id}
        bottomOffset={bottomOffset}
        captionExpanded={captionExpanded}
        onCaptionExpandedChange={setCaptionExpanded}
        author={activePost.isReview ? null : author}
        onAuthorTap={onViewProfile}
        isReview={activePost.isReview}
        golfCourse={activePost.isReview ? null : golfCourse ?? null}
        onCourseTap={golfCourse ? handleCourseTap : undefined}
      />

      {/* Right-side vertical action rail */}
      <FeedActionRail
        creator={creator}
        isFollowing={isFollowed}
        isOwnPost={isOwnPost}
        onCreatorTap={onViewProfile}
        onFollow={() => onFollow(activePost)}
        hasLiked={likeState.isLiked}
        likesCount={likeState.count}
        commentsCount={commentCount}
        onLike={() => onLike(activePost)}
        onComment={onComment}
        onShare={() => onShare(activePost)}
        onMore={onMore}
        isVisible={overlayVisible}
        bottomOffset={bottomOffset}
        readOnly={readOnly}
        isVideo={isVideo}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Video scrubber — sits between bottom content and action rail on video posts */}
      {isVideo && activeVideoElement && overlayVisible && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom:
              bottomOffset !== undefined
                ? `${bottomOffset}px`
                : 'var(--bottom-nav-height, 88px)',
            height: 2,
            pointerEvents: 'auto',
            zIndex: Z.echo + 1,
          }}
        >
          <VideoScrubber videoEl={activeVideoElement} height={2} variant="default" />
        </div>
      )}
    </div>
  );
});

export default FeedOverlayLayer;
