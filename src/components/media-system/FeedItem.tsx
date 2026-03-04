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
}

export function FeedItem({
  post, index, isActive,
}: FeedItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const isMultiMedia = post.mediaItems.length > 1;
  const media = post.mediaItems[0];

  if (!media) return null;

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
