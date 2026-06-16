import React, { memo, useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { BreathingRoomBottomBar } from './BreathingRoomBottomBar';
import { FeedActionRail } from './FeedActionRail';
import { FeedTopActionBar } from './FeedTopActionBar';
import { Z } from '@/config/zIndex';
import { ReviewOverlaySlot } from './ReviewOverlaySlot';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { formatTimeAgo } from '@/utils/formatTime';
import type { FeedPost } from '@/components/media-system/types/media';

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
  } | null;
  isActiveReview?: boolean;
  activeIndexOverride?: number;
  /** Base offset from screen bottom in px. Omit for Clubhouse (respects bottom nav); pass 0 for fullscreen overlay (no nav). */
  bottomOffset?: number;
  /** Read-only mode: hides interactive controls on the action rail (only creator avatar shown). */
  readOnly?: boolean;
  /** When true, render a TOP action bar (fullscreen overlay) instead of the right vertical rail,
   *  move the creator avatar/follow into the bottom-left chip, lift content above a safe area,
   *  and use white "Read review" affordance. */
  topActionBar?: boolean;
  /** Close handler — when topActionBar is true, rendered as a left-most back chevron chip. */
  onClose?: () => void;
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
  topActionBar = false,
  onClose,
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

  // When the fullscreen TOP action bar is rendering, we:
  //  - reserve no right-side gutter for the vertical rail (right: 16 instead of 80)
  //  - lift every bottom-anchored element above the device safe-inset
  //  - skip the duplicate bottom-right floating mute (mute lives in the top bar)
  const bottomCalc = (extra: number): string => {
    const base = bottomOffset ?? 0;
    if (topActionBar) {
      return `calc(max(env(safe-area-inset-bottom, 0px), 24px) + ${base + extra}px)`;
    }
    if (bottomOffset !== undefined) return `${bottomOffset + extra}px`;
    return `calc(var(--bottom-nav-height, 88px) + ${extra}px)`;
  };

  const reviewRightInset = topActionBar ? 16 : 80;

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
      {/* Bottom legibility scrim — guarantees caption/rail contrast on bright photos. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: '42%',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 38%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* Chrome foot — feathers the scrim base into the opaque #0A0E14 nav so the
            nav/scrim seam disappears. Skipped in fullscreen (no nav). */}
        {!topActionBar && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 'calc(var(--bottom-nav-height, 88px) + 36px)',
              background:
                'linear-gradient(to top, #0A0E14 0%, #0A0E14 60%, rgba(10,14,20,0) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* TOP action bar — fullscreen only */}
      {topActionBar && (
        <FeedTopActionBar
          onClose={onClose}
          isVideo={isVideo}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          hasLiked={likeState.isLiked}
          likesCount={likeState.count}
          commentsCount={commentCount}
          onLike={() => onLike(activePost)}
          onComment={onComment}
          onShare={() => onShare(activePost)}
          onMore={onMore}
          isVisible={overlayVisible}
          readOnly={readOnly}
        />
      )}

      {/* Inline Review Card — renders in the bottom slot for review posts. */}
      {activePost.isReview && activePost.review && (
        <div
          style={{
            position: 'fixed',
            left: topActionBar ? 0 : 16,
            right: topActionBar ? 0 : reviewRightInset,
            bottom: bottomCalc(20),
            paddingLeft: topActionBar ? 'max(16px, env(safe-area-inset-left, 0px))' : undefined,
            paddingRight: topActionBar ? 'max(16px, env(safe-area-inset-right, 0px))' : undefined,
            zIndex: Z.echo,
            pointerEvents: overlayVisible ? 'auto' : 'none',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <ReviewOverlaySlot
              activePost={activePost}
              onReviewTap={() => onReviewTap?.()}
              isVisible={overlayVisible}
              whiteReadReview={topActionBar}
            />
          </div>
        </div>
      )}

      {/* Bottom-left content slot (regular posts) */}
      <BreathingRoomBottomBar
        caption={activePost.isReview ? '' : activePost.caption ?? ''}
        tags={activePost.isReview ? [] : tags}
        isVisible={overlayVisible}
        postId={activePost.id}
        bottomOffset={bottomOffset}
        bottomCalc={topActionBar ? bottomCalc : undefined}
        rightInset={topActionBar ? 16 : undefined}
        captionExpanded={captionExpanded}
        onCaptionExpandedChange={setCaptionExpanded}
        author={activePost.isReview ? null : author}
        onAuthorTap={onViewProfile}
        isReview={activePost.isReview}
        golfCourse={activePost.isReview ? null : golfCourse ?? null}
        onCourseTap={golfCourse ? handleCourseTap : undefined}
      />

      {/* Right-side vertical action rail — hidden in fullscreen top-bar mode */}
      {!topActionBar && (
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
      )}

      {/* Video scrubber — sits between bottom content and action rail on video posts */}
      {isVideo && activeVideoElement && overlayVisible && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: bottomCalc(0),
            height: 2,
            pointerEvents: 'auto',
            zIndex: Z.echo + 1,
          }}
        >
          <VideoScrubber videoEl={activeVideoElement} height={2} variant="default" />
        </div>
      )}

      {/* Bottom-right floating mute — Clubhouse only (fullscreen mute lives in top bar) */}
      {isVideo && bottomOffset === undefined && !topActionBar && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleMute();
          }}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(var(--bottom-nav-height, 88px) + 48px)',
            zIndex: Z.echo,
            width: 40,
            height: 40,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            color: '#fff',
            cursor: 'pointer',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 0.2s',
            pointerEvents: overlayVisible ? 'auto' : 'none',
          }}
        >
          {isMuted ? <VolumeX size={20} stroke="#fff" /> : <Volume2 size={20} stroke="#fff" />}
        </button>
      )}
    </div>
  );
});

export default FeedOverlayLayer;
