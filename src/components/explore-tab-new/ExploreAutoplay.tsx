/**
 * ExploreAutoplay - [VIDEOSTUB] Gutted to no-op.
 */
import type { RefObject } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

interface ExploreAutoplayProps {
  posts: FeedPost[];
  gridRef: RefObject<HTMLElement>;
}

export default function ExploreAutoplay(_props: ExploreAutoplayProps) {
  return null;
}
