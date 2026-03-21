import React, { memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
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
  const currentMediaIndex = carouselPositions.get(activeIndex) ?? 0;
  const mediaCount = activePost.mediaItems?.length ?? 0;
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
          likeCount={likeState.count}
          commentCount={commentCount}
          shareCount={activePost.shareCount}
          isLiked={likeState.isLiked}
          isMuted={isMuted}
          onLike={() => onLike(activePost)}
          onComment={onComment}
          onShare={() => onShare(activePost)}
          onMuteToggle={toggleMute}
          onMore={onMore}
          isVideo={isVideo}
          isOwnPost={isOwnPost}
        />
      </div>

      {/* Creator Capsule */}
      <div style={{ pointerEvents: 'auto' }}>
        <CreatorCapsule
          username={activePost.username}
          displayName={activePost.displayName}
          avatarUrl={activePost.avatarUrl}
          caption={activePost.caption}
          isVerified={activePost.isVerified}
          isFollowed={isFollowed}
          onFollow={() => onFollow(activePost)}
          onViewProfile={onViewProfile}
          courseName={activePost.courseName}
          courseId={activePost.courseId}
          tags={activePost.tags}
          isOwnPost={isOwnPost}
        />
      </div>

      {/* Media Navigation Dots */}
      {mediaCount > 1 && (
        <div className="absolute bottom-[120px] left-0 right-0 flex justify-center" style={{ pointerEvents: 'auto' }}>
          <MediaNavigationDots
            total={mediaCount}
            current={currentMediaIndex}
          />
        </div>
      )}

      {/* Video Scrubber */}
      {isVideo && activeVideoElement && (
        <div className="absolute bottom-[100px] left-4 right-16" style={{ pointerEvents: 'auto' }}>
          <VideoScrubber
            videoEl={activeVideoElement}
            height={3}
            variant="fullscreen"
          />
        </div>
      )}

      {/* Review Overlay */}
      {activePost.isReview && activePost.review && (
        <div style={{ pointerEvents: 'auto' }}>
          <FullscreenReviewPost
            review={activePost.review}
            onTap={onReviewTap}
          />
        </div>
      )}
    </div>
  );
});

export default FeedOverlayLayer;
