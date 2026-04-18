import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { BreathingRoomBottomBar } from './BreathingRoomBottomBar';
import { Z } from '@/config/zIndex';
import { VideoScrubber } from '@/components/video/VideoScrubber';
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
  overlayVisible,
  isOwnPost,
  golfCourse,
  onBeforeNavigate,
  activeIndexOverride,
}: FeedOverlayLayerProps) {
  const navigate = useNavigate();
  const clubhouseActiveIndex = useClubhouseStore(s => s.activeIndex);
  const activeIndex = activeIndexOverride ?? clubhouseActiveIndex;
  const activeVideoElement = useClubhouseStore(s => s.activeVideoElement);

  const activePost = posts[activeIndex] ?? null;

  if (!activePost) return null;

  // Hide overlays on editorial and tournament cards (they have their own chrome)
  if (
    activePost.postType === 'tournament_result' ||
    activePost.postType === 'pga_card' ||
    activePost.postType === 'course_of_week_card'
  ) return null;

  const likeState = getLikeState(activePost);
  const commentCount = getCommentCount(activePost);
  const isFollowed = getFollowState(activePost);
  const isVideo = activePost.mediaItems?.[0]?.type === 'video';

  const tags = activePost.tags ?? [];
  const taggedFriends = tags
    .filter(t => t.entity_type === 'user')
    .map(t => ({
      id: t.entity_id,
      username: t.username ?? '',
      displayName: t.name,
    }));

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
      {/* Course chip — anchored below the combined top bar */}
      {golfCourse && (
        <motion.button
          type="button"
          onClick={() => {
            onBeforeNavigate?.();
            navigate(`/courses/${golfCourse.id}`);
          }}
          initial={false}
          animate={{
            opacity: overlayVisible ? 1 : 0,
            y: overlayVisible ? 0 : -4,
          }}
          transition={{ duration: 0.18, ease: 'easeOut', delay: overlayVisible ? 0.04 : 0 }}
          style={{
            position: 'fixed',
            top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 112px)',
            left: 16,
            zIndex: Z.echo,
            pointerEvents: overlayVisible ? 'auto' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: 'calc(100% - 32px)',
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(0, 0, 0, 0.50)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            cursor: 'pointer',
            fontFamily: 'Geist, system-ui, sans-serif',
          }}
        >
          <MapPin size={11} fill="#F7931E" stroke="#F7931E" strokeWidth={1} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {golfCourse.name}
          </span>
        </motion.button>
      )}

      {/* Bottom bar (caption + horizontal actions + FOLLOW) */}
      <BreathingRoomBottomBar
        caption={activePost.caption ?? ''}
        tags={tags}
        taggedFriends={taggedFriends}
        likesCount={likeState.count}
        commentsCount={commentCount}
        hasLiked={likeState.isLiked}
        isVisible={overlayVisible}
        onLike={() => onLike(activePost)}
        onComment={onComment}
        onShare={() => onShare(activePost)}
        onMore={onMore}
        isVideo={isVideo}
        isFollowing={isFollowed}
        isOwnPost={isOwnPost}
        onFollow={() => onFollow(activePost)}
      />

      {/* Video Scrubber — anchored to the top edge of the bottom nav bar */}
      {isVideo && activeVideoElement && (
        <div
          style={{
            position: 'fixed',
            bottom: 'var(--bottom-nav-height, 88px)',
            left: 0,
            right: 0,
            pointerEvents: 'auto',
            zIndex: 31,
          }}
        >
          <VideoScrubber
            videoEl={activeVideoElement}
            height={3}
            variant="fullscreen"
          />
        </div>
      )}
    </div>
  );
});

export default FeedOverlayLayer;
