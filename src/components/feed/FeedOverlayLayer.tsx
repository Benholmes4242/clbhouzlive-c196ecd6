import React, { memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';

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
  activeReview,
  isActiveReview,
}: FeedOverlayLayerProps) {
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const carouselPositions = useClubhouseStore(s => s.carouselPositions);
  const activeVideoElement = useClubhouseStore(s => s.activeVideoElement);

  const activePost = posts[activeIndex] ?? null;
  if (!activePost) return null;

  const isTournamentCard =
    activePost.postType === 'tournament_live' ||
    activePost.postType === 'tournament_result';

  // Hide overlays on tournament cards
  if (isTournamentCard) return null;

  const likeState = getLikeState(activePost);
  const commentCount = getCommentCount(activePost);
  const isFollowed = getFollowState(activePost);
  const isVideo = activePost.mediaItems?.[0]?.type === 'video';

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
      {/* Action Rail */}
      <div style={{ pointerEvents: 'auto' }}>
        <CinematicActionRail
          postId={activePost.id}
          likesCount={likeState.count}
          commentsCount={commentCount}
          hasLiked={likeState.isLiked}
          isMuted={isMuted}
          isVisible={overlayVisible}
          onLike={() => onLike(activePost)}
          onComment={onComment}
          onShare={() => onShare(activePost)}
          onMuteToggle={toggleMute}
          onMore={onMore}
          isVideo={isVideo}
          isReviewPost={isActiveReview}
        />
      </div>




      {/* Creator Capsule */}
      <div style={{ pointerEvents: 'auto' }}>
        <CreatorCapsule
          user={{
            id: activePost.userId,
            name: activePost.displayName,
            username: activePost.username,
            avatar: activePost.avatarUrl,
          }}
          caption={activePost.caption}
          tags={activePost.tags}
          golfCourse={golfCourse ? { id: golfCourse.id, name: golfCourse.name, country: golfCourse.country } : null}
          isFollowing={isFollowed}
          isOwnPost={isOwnPost}
          isVisible={overlayVisible}
          onFollow={() => onFollow(activePost)}
          onViewProfile={onViewProfile}
          isReview={isActiveReview}
          reviewData={activeReview ? {
            courseId: activeReview.courseId,
            courseName: activeReview.courseName,
            courseLocation: undefined,
            rating: activeReview.rating,
            tierLabel: '',
            sourceReviewId: activeReview.reviewId,
          } : undefined}
          onReviewTap={onReviewTap}
          postId={activePost.id}
        />
      </div>

      {/* Video Scrubber — anchored to the top edge of the bottom nav bar */}
      {isVideo && activeVideoElement && (
        <div
          style={{
            position: 'fixed',
            bottom: '85px',
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
