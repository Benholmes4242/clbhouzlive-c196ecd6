/**
 * CourseMediaAutoplay - [VIDEOSTUB] Gutted to no-op.
 */
import type { FeedPost } from '@/components/media-system/types/media';

interface CourseMediaAutoplayProps {
  posts: FeedPost[];
  gridRef: React.RefObject<HTMLDivElement>;
}

export const CourseMediaAutoplay: React.FC<CourseMediaAutoplayProps> = () => null;
