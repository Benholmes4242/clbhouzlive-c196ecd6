/**
 * FeedItem — one full-screen item in the vertical feed.
 * Pure video engine: no UI overlays. Overlay integration deferred to Clubhouse UI layer.
 */
import { useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ImageViewer } from './ImageViewer';
import { MediaCarousel } from './MediaCarousel';
import type { FeedPost } from './types/media';

interface FeedItemProps {
  post: FeedPost;
  index: number;
  isActive: boolean;
  isLastItem?: boolean;
  hasNextPage?: boolean;
  followOverride?: boolean;
  onFollowChange?: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
}

export function FeedItem({
  post, index, isActive, onFirstFrameReady,
}: FeedItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const isMultiMedia = post.mediaItems.length > 1;
  const media = post.mediaItems[0];

  if (!media) {
    // Review posts without media — render course image backdrop or plain dark
    if (post.isReview && post.review?.courseImageUrl) {
      return (
        <div
          ref={ref}
          className="relative w-full flex-shrink-0"
          style={{ height: '100dvh', background: '#0A0A0A' }}
        >
          <img
            src={post.review.courseImageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.4,
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
            }}
          />
        </div>
      );
    }
    if (post.isReview) {
      return (
        <div
          ref={ref}
          className="relative w-full flex-shrink-0"
          style={{ height: '100dvh', background: '#0A0A0A' }}
        />
      );
    }
    return null;
  }

  return (
    <div
      ref={ref}
      className="relative w-full flex-shrink-0"
      style={{ height: '100dvh' }}
    >
      {isMultiMedia ? (
        <MediaCarousel
          mediaItems={post.mediaItems}
          feedIndex={index}
          isActive={isActive}
        />
      ) : media.type === 'video' && media.hlsUrl ? (
        <VideoPlayer
          hlsUrl={media.hlsUrl}
          mp4Url={media.mp4Url}
          feedIndex={index}
          isActive={isActive}
          thumbnailUrl={media.thumbnailUrl}
          duration={media.duration}
          onFirstFrameReady={onFirstFrameReady}
        />
      ) : media.imageUrl ? (
        <ImageViewer
          imageUrl={media.imageUrl}
          thumbnailUrl={media.thumbnailUrl}
          width={media.width}
          height={media.height}
        />
      ) : null}
    </div>
  );
}
