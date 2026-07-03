// No-op stub (Stage C, BRIEF_VIDEO_TEARDOWN.md).
// The video engine is severed to a poster-only chassis, so there's no
// playback state to poll or write. Export the same hook signature so all
// callers continue to compile and mount without changes; wire it back to
// the new engine when it lands.
import type { FeedPost } from '@/components/media-system/types/media';

interface UseWatchProgressTrackerParams {
  userId: string | undefined;
  activeIndex: number;
  posts: FeedPost[];
  getContainer?: () => HTMLElement | null;
  enabled?: boolean;
}

export function useWatchProgressTracker(_params: UseWatchProgressTrackerParams): void {
  // intentional no-op
}
