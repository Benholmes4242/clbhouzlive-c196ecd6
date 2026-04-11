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

    // Priority 1: review post — always has real course id
    if (activePost.review) {
      return {
        id: activePost.review.courseId,
        name: activePost.review.courseName,
        courseCountry: activePost.review.courseCountry || null,
        thumbnailImage: activePost.courseThumbnailImage ?? null,
        latitude: activePost.courseLatitude ?? null,
        longitude: activePost.courseLongitude ?? null,
        globalRank: activePost.courseGlobalRank ?? null,
      };
    }

    // Priority 2: direct course_id on the post
    if (activePost.courseId) {
      return {
        id: activePost.courseId,
        name: activePost.courseName || null,
        courseCountry: null,
        thumbnailImage: activePost.courseThumbnailImage ?? null,
        latitude: activePost.courseLatitude ?? null,
        longitude: activePost.courseLongitude ?? null,
        globalRank: activePost.courseGlobalRank ?? null,
      };
    }

    // Priority 3: golf_club tag — has real course UUID as entity_id
    const courseTag = activePost.tags?.find(t => t.entity_type === 'golf_club');
    if (courseTag) {
      return {
        id: courseTag.entity_id,
        name: courseTag.name,
        courseCountry: null,
        thumbnailImage: activePost.courseThumbnailImage ?? null,
        latitude: activePost.courseLatitude ?? null,
        longitude: activePost.courseLongitude ?? null,
        globalRank: activePost.courseGlobalRank ?? null,
      };
    }

    // Priority 4: caption text extraction — no real id, fallback only
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
  }, [activePost?.id, activePost?.review, activePost?.courseId, activePost?.courseName, activePost?.tags, activePost?.caption]);

  const activeReview = activePost?.review ?? null;
  const isActiveReview = activePost?.isReview ?? false;

  const isActiveVideo = useMemo(() => {
    const media = activePost?.mediaItems?.[0];
    return !!(media?.hlsUrl || media?.mp4Url);
  }, [activePost?.id, activePost?.mediaItems]);

  return { activePost, golfCourse, activeReview, isActiveReview, isActiveVideo };
}
