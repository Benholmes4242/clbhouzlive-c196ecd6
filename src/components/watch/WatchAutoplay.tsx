/**
 * WatchAutoplay - [VIDEOSTUB] Gutted to no-op.
 *
 * Poster-only chassis: this coordinator no longer creates a video pool,
 * attaches HLS, observes tiles, or prefetches. Tiles show static posters.
 * Kept as an exported component so page renders resolve unchanged.
 */
import type { FeedPost } from '@/components/media-system/types/media';

interface WatchAutoplayProps {
  posts: FeedPost[];
  gridRef: React.RefObject<HTMLDivElement>;
}

const WatchAutoplay: React.FC<WatchAutoplayProps> = () => null;

export default WatchAutoplay;
