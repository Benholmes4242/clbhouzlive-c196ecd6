/**
 * FeedItem — one full-screen item in the vertical feed.
 * Renders MediaCarousel for multi-media, single VideoPlayer/ImageViewer for single.
 * Includes SocialOverlay with auto-hide and EndOfFeed overlay.
 */
import { useRef, useState, useCallback } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ImageViewer } from './ImageViewer';
import { MediaCarousel } from './MediaCarousel';
import { SocialOverlay } from './SocialOverlay';
import { EndOfFeed } from './EndOfFeed';
import type { FeedPost } from './types/media';

interface FeedItemProps {
  post: FeedPost;
  index: number;
  isActive: boolean;
  isLastItem?: boolean;
  hasNextPage?: boolean;
}

export function FeedItem({ post, index, isActive, isLastItem = false, hasNextPage = true }: FeedItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
    // TODO: wire to actual like mutation
  }, []);

  const handleScrubStart = useCallback(() => setIsScrubbing(true), []);
  const handleScrubEnd = useCallback(() => setIsScrubbing(false), []);

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
          onDoubleTapLike={handleLike}
          onScrubStart={handleScrubStart}
          onScrubEnd={handleScrubEnd}
        />
      ) : media.type === 'video' && media.hlsUrl ? (
        <VideoPlayer
          hlsUrl={media.hlsUrl}
          mp4Url={media.mp4Url}
          feedIndex={index}
          isActive={isActive}
          thumbnailUrl={media.thumbnailUrl}
          duration={media.duration}
          onDoubleTapLike={handleLike}
          onScrubStart={handleScrubStart}
          onScrubEnd={handleScrubEnd}
        />
      ) : media.imageUrl ? (
        <ImageViewer
          imageUrl={media.imageUrl}
          thumbnailUrl={media.thumbnailUrl}
          width={media.width}
          height={media.height}
        />
      ) : null}

      {/* Social overlay */}
      <SocialOverlay
        post={post}
        isActive={isActive}
        isScrubbing={isScrubbing}
        onLike={handleLike}
        isLiked={isLiked}
      />

      {/* End of feed overlay */}
      {isLastItem && !hasNextPage && (
        <EndOfFeed visible={isActive} />
      )}
    </div>
  );
}
