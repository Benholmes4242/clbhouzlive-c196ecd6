import React, { useMemo, useCallback } from 'react';
import { useStore } from 'zustand';
import { useNavigate } from 'react-router-dom';
import type { FeedPost } from '@/components/media-system/types/media';
import type { MediaStore } from '@/components/media-system/store/createMediaStore';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface FullscreenCreatorCapsuleProps {
  posts: FeedPost[];
  store: MediaStore;
}

export function FullscreenCreatorCapsule({ posts, store }: FullscreenCreatorCapsuleProps) {
  const activeIndex = useStore(store, (s) => s.activeIndex);
  const navigate = useNavigate();
  const activePost = posts[activeIndex];

  // Build golfCourse prop — same logic as Clubhouse.tsx
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
    // Also check courseId/courseName from post-level fields
    if (activePost.courseName) {
      return {
        id: activePost.courseId || null,
        name: activePost.courseName,
        courseCountry: null,
      };
    }
    return undefined;
  }, [activePost?.id, activePost?.review, activePost?.caption, activePost?.courseName, activePost?.courseId]);

  const isActiveReview = activePost?.isReview ?? false;
  const activeReview = activePost?.review ?? null;

  const handleReviewTap = useCallback(() => {
    if (!activeReview) return;
    navigate(`/courses/${activeReview.courseId}?tab=reviews&review=${activeReview.reviewId}`);
  }, [activeReview, navigate]);

  if (!activePost) return null;

  return (
    <CreatorCapsule
      user={{
        id: activePost.userId,
        name: activePost.displayName,
        username: activePost.username,
        avatar: activePost.avatarUrl,
      }}
      caption={activePost.caption}
      golfCourse={golfCourse}
      isFollowing={activePost.isFollowedByMe}
      isOwnPost={false}
      isVisible={true}
      isReview={isActiveReview}
      reviewData={isActiveReview && activeReview ? {
        rating: activeReview.rating,
        courseName: activeReview.courseName,
        courseId: activeReview.courseId,
        tierLabel: activeReview.rating >= 9 ? 'Outstanding' : activeReview.rating >= 7 ? 'Excellent' : 'Good',
        sourceReviewId: activeReview.reviewId,
      } : undefined}
      onReviewTap={handleReviewTap}
      
    />
  );
}
