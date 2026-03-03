/**
 * FeedItem — one full-screen item in the vertical feed.
 * Registers with the viewport observer for activation.
 */
import { useRef, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import type { FeedPost } from './types/media';

interface FeedItemProps {
  post: FeedPost;
  index: number;
  isActive: boolean;
  observe: (el: HTMLElement, index: number) => void;
  unobserve: (el: HTMLElement) => void;
}

export function FeedItem({ post, index, isActive, observe, unobserve }: FeedItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    observe(el, index);
    return () => unobserve(el);
  }, [index, observe, unobserve]);

  // Use first media item for Phase 1
  const media = post.mediaItems[0];
  if (!media) return null;

  return (
    <div
      ref={ref}
      className="relative w-full flex-shrink-0"
      style={{ height: '100dvh', scrollSnapAlign: 'start' }}
    >
      {media.type === 'video' && media.hlsUrl ? (
        <VideoPlayer
          hlsUrl={media.hlsUrl}
          feedIndex={index}
          isActive={isActive}
          thumbnailUrl={media.thumbnailUrl}
        />
      ) : media.imageUrl ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <img
            src={media.imageUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        </div>
      ) : null}

      {/* Caption overlay — bottom left */}
      {post.caption && (
        <div
          className="absolute bottom-8 left-4 right-16 z-20 pointer-events-none"
        >
          <p className="text-white text-sm font-medium leading-snug drop-shadow-lg line-clamp-3">
            {post.caption}
          </p>
        </div>
      )}
    </div>
  );
}
