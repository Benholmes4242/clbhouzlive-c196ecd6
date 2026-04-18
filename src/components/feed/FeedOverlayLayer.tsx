import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { BreathingRoomBottomBar } from './BreathingRoomBottomBar';
import { Z } from '@/config/zIndex';
import { BreathingRoomMuteToggle } from './BreathingRoomMuteToggle';
import { ReviewHeaderPanel } from './ReviewHeaderPanel';
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
  onReviewTap,
  overlayVisible,
  isOwnPost,
  golfCourse,
  onBeforeNavigate,
  activeIndexOverride,
  bottomOffset,
}: FeedOverlayLayerProps) {
  const navigate = useNavigate();
  const clubhouseActiveIndex = useClubhouseStore(s => s.activeIndex);
  const activeIndex = activeIndexOverride ?? clubhouseActiveIndex;
  const activeVideoElement = useClubhouseStore(s => s.activeVideoElement);

  const activePost = posts[activeIndex] ?? null;

  const [captionExpanded, setCaptionExpanded] = useState(false);

  useEffect(() => {
    setCaptionExpanded(false);
  }, [activePost?.id]);

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
      {/* Course chip — hidden on review posts (review panel shows the course instead) */}
      {golfCourse && !activePost.isReview && (
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
            top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 68px)',
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

      {/* Mute toggle — only on video posts */}
      {isVideo && <BreathingRoomMuteToggle isVisible={overlayVisible} bottomOffset={bottomOffset} />}

      {/* Review Header Panel — only on review posts, sits above the bottom bar */}
      {activePost.isReview && activePost.review && (
        <motion.div
          initial={false}
          animate={{ y: captionExpanded ? -220 : 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: bottomOffset !== undefined
              ? `${bottomOffset + 140}px`
              : 'calc(var(--bottom-nav-height, 88px) + 140px)',
            zIndex: Z.echo,
            pointerEvents: 'none',
          }}
        >
          <ReviewHeaderPanel
            courseName={activePost.review.courseName}
            courseImageUrl={activePost.review.courseImageUrl}
            courseRegion={activePost.review.courseRegion}
            courseCountry={activePost.review.courseCountry}
            courseSubCountry={activePost.review.courseSubCountry}
            rating={activePost.review.rating}
            isVisible={overlayVisible}
            onTap={() => onReviewTap?.()}
          />
        </motion.div>
      )}

      {/* Bottom bar (caption + horizontal actions + FOLLOW) — scrubber rendered internally on videos */}
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
        activeVideoElement={isVideo ? activeVideoElement : null}
        postId={activePost.id}
        bottomOffset={bottomOffset}
        captionExpanded={captionExpanded}
        onCaptionExpandedChange={setCaptionExpanded}
      />
    </div>
  );
});

export default FeedOverlayLayer;
