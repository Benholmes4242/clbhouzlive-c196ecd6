import { useMemo } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';

/**
 * Derives active-post-related values from the feed array + activeIndex.
 * Pure computation — no side effects.
 */
export function useActivePostDerived(posts: FeedPost[], activeIndex: number) {
  const activePostId = posts[activeIndex]?.id;
  

  const activePost = useMemo(
    () => posts.find(p => p.id === activePostId) ?? null,
    [posts, activePostId],
  );

  const golfCourse = useMemo(() => {
    if (!activePost) return undefined;
    if (activePost.review) {
      return {
        id: activePost.review.courseId,
        name: activePost.review.courseName,
        courseCountry: activePost.review.courseCountry || null,
      };
    }
    if (activePost.caption) {
      const extracted = extractGolfCourseFromContent(activePost.caption);
      if (extracted) {
        return {
          id: null as string | null,
          name: extracted.name,
          courseCountry: extracted.country || null,
        };
      }
    }
    return undefined;
  }, [activePost?.id, activePost?.review, activePost?.caption]);

  const activeReview = activePost?.review ?? null;
  const isActiveReview = activePost?.isReview ?? false;

  const isActiveVideo = useMemo(() => {
    const media = activePost?.mediaItems?.[0];
    return !!(media?.hlsUrl || media?.mp4Url);
  }, [activePost?.id, activePost?.mediaItems]);

  return { activePost, golfCourse, activeReview, isActiveReview, isActiveVideo };
}
