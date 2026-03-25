import React, { memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapVideoPlayer } from './SnapVideoPlayer';
import { FeedImageCarousel } from './FeedImageCarousel';
import { TournamentResultCard } from '@/components/clubhouse/cinematic/TournamentResultCard';
import { PGACard } from '@/components/clubhouse/cinematic/PGACard';
import type { FeedPost, TournamentResultFeedPost, PGACardFeedPost } from '@/components/media-system/types/media';

interface FeedSlideProps {
  post: FeedPost;
  index: number;
  setRef: (el: HTMLDivElement | null) => void;
  activeTab: string;
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
  onLike?: (post: FeedPost) => void;
  onComment?: () => void;
  onShare?: (post: FeedPost) => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
}

export const FeedSlide = memo(function FeedSlide({
  post,
  index,
  setRef,
  activeTab,
  onFirstFrameReady,
  onLike,
  onComment,
  onShare,
  getLikeState,
  getCommentCount,
}: FeedSlideProps) {
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const isActive = activeIndex === index;
  const isSuggestedFeed = activeTab === 'foryou';
  const media = post.mediaItems;

  // ── Content routing ──
  const renderContent = () => {
    // Tournament result card
    if (post.postType === 'tournament_result') {
      const likeState = getLikeState?.(post) ?? { isLiked: false, count: 0 };
      const commentCount = getCommentCount?.(post) ?? 0;
      return (
        <TournamentResultCard
          post={post as unknown as TournamentResultFeedPost}
          isActive={isActive}
          isVisible={isActive}
          onLike={() => onLike?.(post)}
          onComment={() => onComment?.()}
          onShare={() => onShare?.(post)}
          likeOverride={likeState}
          commentCountOverride={commentCount}
        />
      );
    }

    // Multi-media (any mix of video + image) → FeedImageCarousel
    if (media && media.length > 1) {
      return (
        <FeedImageCarousel
          mediaItems={media}
          feedIndex={index}
          isSuggestedFeed={isSuggestedFeed}
          isActive={isActive}
          onDoubleTapLike={() => onLike?.(post)}
        />
      );
    }

    // Single video
    if (media?.[0]?.type === 'video') {
      const first = media[0];
      return (
        <SnapVideoPlayer
          hlsUrl={first.hlsUrl || ''}
          mp4Url={first.mp4Url}
          thumbnailUrl={first.thumbnailUrl}
          width={first.width}
          height={first.height}
          duration={first.duration}
          isActive={isActive}
          activeIndex={activeIndex}
          feedIndex={index}
          isSuggestedFeed={isSuggestedFeed}
          onDoubleTapLike={() => onLike?.(post)}
          onFirstFrameReady={onFirstFrameReady}
        />
      );
    }

    // Single image
    if (media?.[0]?.type === 'image') {
      const first = media[0];
      const isLandscape = (first.width ?? 0) > (first.height ?? 1);
      const objectFit = isLandscape ? 'contain' : 'cover';
      const imgSrc = first.imageUrl || first.thumbnailUrl || '';
      return (
        <div className="absolute inset-0 overflow-hidden">
          {/* Blurred background for letterboxing */}
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
            draggable={false}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/55" />
          {/* Main image */}
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit, position: 'relative', zIndex: 1 }}
            loading="eager"
            draggable={false}
          />
        </div>
      );
    }

    // Text-only fallback
    return (
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <p className="text-white text-lg text-center leading-relaxed">
          {post.caption || ''}
        </p>
      </div>
    );
  };

  return (
    <div
      ref={setRef}
      data-index={index}
      className="relative w-full overflow-hidden flex-shrink-0"
      aria-hidden={!isActive}
      {...(!isActive ? { inert: '' } : {})}
      style={{
        height: '100dvh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        background: '#000',
      }}
    >
      {renderContent()}
    </div>
  );
});

export default FeedSlide;
