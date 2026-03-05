import { useEffect, useRef } from 'react';
import type { FeedPost } from '../types/media';
import { trackEvent } from '@/utils/analyticsEvents';

export function useVideoAnalytics(
  post: FeedPost | null,
  isActive: boolean,
  videoElement: HTMLVideoElement | null
) {
  const watchStartRef = useRef<number | null>(null);
  const impressionTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isActive && post && post.id !== impressionTrackedRef.current) {
      impressionTrackedRef.current = post.id;
      trackEvent('video_impression', {
        post_id: post.id,
        creator_id: post.userId,
        is_review: post.isReview,
      });
      watchStartRef.current = Date.now();
    }

    return () => {
      if (watchStartRef.current && post) {
        const watchTimeMs = Date.now() - watchStartRef.current;
        if (watchTimeMs > 1000) {
          trackEvent('video_watch_time', {
            post_id: post.id,
            watch_time_ms: watchTimeMs,
            watch_time_seconds: Math.round(watchTimeMs / 1000),
            completed: videoElement
              ? videoElement.currentTime >= (videoElement.duration * 0.9)
              : false,
          });
        }
        watchStartRef.current = null;
      }
    };
  }, [isActive, post?.id]);
}
