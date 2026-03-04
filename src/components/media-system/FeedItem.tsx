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
  onDoubleTapLike?: () => void;
}

export function FeedItem({
  post, index, isActive, onDoubleTapLike,
}: FeedItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const isMultiMedia = post.mediaItems.length > 1;
  const media = post.mediaItems[0];

  // Review/text-only posts with no media — render dark background for overlay
  if (!media) {
    const courseImage = post.review?.courseImageUrl;
    return (
      <div
        ref={ref}
        className="relative w-full flex-shrink-0"
        style={{ height: '100dvh' }}
      >
        <div className="relative w-full h-full bg-black overflow-hidden">
          {/* Course hero image background if available */}
          {courseImage && (
            <>
              <img
                src={courseImage}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'blur(8px) brightness(0.4)', transform: 'scale(1.1)' }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </>
          )}
        </div>
      </div>
    );
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
          onDoubleTapLike={onDoubleTapLike}
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
