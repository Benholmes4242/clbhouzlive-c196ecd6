import React, { memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapVideoPlayer } from './SnapVideoPlayer';
import { FeedImageCarousel } from './FeedImageCarousel';
import { TournamentLiveCard } from '@/components/clubhouse/cinematic/TournamentLiveCard';
import { TournamentResultCard } from '@/components/clubhouse/cinematic/TournamentResultCard';
import type { FeedPost, TournamentLiveFeedPost, TournamentResultFeedPost } from '@/components/media-system/types/media';

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
  getLikeState,
  getCommentCount,
}: FeedSlideProps) {
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const isActive = activeIndex === index;
  const isSuggestedFeed = activeTab === 'foryou';
  const media = post.mediaItems;

  // ── Content routing ──
  const renderContent = () => {
    // Tournament cards
    if (post.postType === 'tournament_live') {
      const likeState = getLikeState?.(post) ?? { isLiked: false, count: 0 };
      const commentCount = getCommentCount?.(post) ?? 0;
      return (
        <TournamentLiveCard
          post={post as TournamentLiveFeedPost}
          isActive={isActive}
          onComment={onComment}
          onLike={() => onLike?.(post)}
          likeOverride={likeState}
          commentCountOverride={commentCount}
        />
      );
    }

    if (post.postType === 'tournament_result') {
      const likeState = getLikeState?.(post) ?? { isLiked: false, count: 0 };
      const commentCount = getCommentCount?.(post) ?? 0;
      return (
        <TournamentResultCard
          post={post as unknown as TournamentResultFeedPost}
          isActive={isActive}
          onComment={onComment}
          onLike={() => onLike?.(post)}
          likeOverride={likeState}
          commentCountOverride={commentCount}
        />
      );
    }

    // Video posts
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
          feedIndex={index}
          isSuggestedFeed={isSuggestedFeed}
          onDoubleTapLike={() => onLike?.(post)}
          onFirstFrameReady={onFirstFrameReady}
        />
      );
    }

    // Multi-image carousel
    if (media && media.length > 1 && media.every(m => m.type === 'image')) {
      return (
        <FeedImageCarousel
          mediaItems={media}
          feedIndex={index}
          isSuggestedFeed={isSuggestedFeed}
        />
      );
    }

    // Single image
    if (media?.[0]?.type === 'image') {
      const first = media[0];
      const isLandscape = (first.width ?? 0) > (first.height ?? 1);
      const objectFit = isSuggestedFeed ? 'cover' : (isLandscape ? 'contain' : 'cover');
      return (
        <img
          src={first.imageUrl || first.thumbnailUrl || ''}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit, background: '#000' }}
          loading="eager"
          draggable={false}
        />
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
      style={{
        height: '100dvh',
        scrollSnapAlign: 'start',
        background: '#000',
      }}
    >
      {renderContent()}
    </div>
  );
});

export default FeedSlide;
