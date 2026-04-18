import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { BreathingRoomIdentityPill } from './BreathingRoomIdentityPill';
import { BreathingRoomBottomBar } from './BreathingRoomBottomBar';

import { VideoScrubber } from '@/components/video/VideoScrubber';
import type { FeedPost } from '@/components/media-system/types/media';
import { formatTimeAgo } from '@/utils/formatTime';

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
  onViewProfile,
  onReviewTap,
  overlayVisible,
  isOwnPost,
  golfCourse,
  onBeforeNavigate,
  activeReview,
  isActiveReview,
  activeIndexOverride,
}: FeedOverlayLayerProps) {
  const navigate = useNavigate();
  const clubhouseActiveIndex = useClubhouseStore(s => s.activeIndex);
  const activeIndex = activeIndexOverride ?? clubhouseActiveIndex;
  const carouselPositions = useClubhouseStore(s => s.carouselPositions);
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

  const timeAgoLabel = activePost.createdAt
    ? formatTimeAgo(activePost.createdAt, 'short')
    : '';

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
      {/* Identity pill (top-anchored) + course chip */}
      <BreathingRoomIdentityPill
        user={{
          id: activePost.userId,
          displayName: activePost.displayName,
          username: activePost.username,
          avatarUrl: activePost.avatarUrl,
          // TODO: surface user_profiles.eg_handicap_index in FeedPost builders
          handicapIndex: null,
        }}
        course={golfCourse ? { id: golfCourse.id, name: golfCourse.name } : null}
        timeAgoLabel={timeAgoLabel}
        isFollowing={isFollowed}
        isOwnPost={isOwnPost}
        isVisible={overlayVisible}
        onFollow={() => onFollow(activePost)}
        onViewProfile={onViewProfile}
        onCourseTap={
          golfCourse
            ? () => {
                onBeforeNavigate?.();
                navigate(`/courses/${golfCourse.id}`);
              }
            : undefined
        }
      />

      {/* Bottom bar (caption + horizontal actions) */}
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
