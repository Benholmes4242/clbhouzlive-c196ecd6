import React, { useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { MoreHorizontal } from 'lucide-react';

interface ReviewCardProps {
  post: FeedPost;
  allPosts?: FeedPost[];
  postIndex?: number;
  isOwnPost?: boolean;
  onDelete?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  post,
  allPosts,
  postIndex,
  isOwnPost,
  onDelete,
}) => {
  const review = post.review!;
  const tileRef = useRef<HTMLDivElement>(null);

  const courseImageUrl =
    review.courseImageUrl ||
    post.mediaItems[0]?.thumbnailUrl ||
    post.mediaItems[0]?.imageUrl ||
    null;

  const ratingDisplay =
    review.rating % 1 === 0 ? review.rating.toFixed(0) : review.rating.toFixed(1);

  const locationLine = [review.courseSubCountry, review.courseRegion]
    .filter(Boolean)
    .join(' · ');

  // Editorial 4-stop gradient + image background — mirrors the
  // "Highest Rated" hero in CoursesLeaderboardView. No slate body slab.
  const fallbackBg = 'linear-gradient(135deg, #2d5a3d, #1a3d2e)';
  const heroBg = courseImageUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.85) 100%), url(${courseImageUrl}) center/cover`
    : fallbackBg;

  return (
    <div
      ref={tileRef}
      className="relative overflow-hidden cursor-pointer"
      style={{
        // Lock card height to match prior layout (21:9 media + ~80px body slab).
        // On a typical mobile width (~375px) this preserves the prior visual footprint.
        minHeight: 302,
        color: '#fff',
        background: heroBg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onClick={() => {
        if (allPosts && postIndex != null) {
          useFullscreenFeedStore.getState().open(allPosts, postIndex);
        }
      }}
    >
      {/* Top accent + rating */}
      <div style={{ position: 'relative' }}>
        {/* Amber accent bar */}
        <div
          style={{
            height: 2,
            background: 'linear-gradient(90deg, #F7931E 0%, transparent 70%)',
          }}
        />

        {/* Rating — top-right, huge serif */}
        <div
          className="absolute flex items-baseline"
          style={{
            top: 12,
            right: 14,
            gap: 2,
            fontFamily: 'Georgia, "Times New Roman", serif',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <span
            className="text-white font-black leading-none"
            style={{ fontSize: 36, letterSpacing: '-0.04em' }}
          >
            {ratingDisplay}
          </span>
          <span
            className="text-white/55 font-medium"
            style={{ fontSize: 14, fontFamily: 'system-ui, sans-serif' }}
          >
            /10
          </span>
        </div>
      </div>

      {/* Bottom content block — sits directly on the gradient (no slate slab) */}
      <div style={{ padding: '14px 18px 16px' }}>
        {/* Course name + location */}
        <div
          className="text-white font-black"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 22,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 18px rgba(0,0,0,0.55)',
          }}
        >
          {review.courseName}
        </div>
        {locationLine && (
          <div
            className="text-white/70"
            style={{
              fontSize: 11,
              marginTop: 2,
              textShadow: '0 1px 10px rgba(0,0,0,0.55)',
            }}
          >
            {locationLine}
          </div>
        )}

        {/* Excerpt */}
        {review.reviewText && (
          <div
            className="italic line-clamp-2"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              marginTop: 10,
              color: 'rgba(255,255,255,0.82)',
              textShadow: '0 1px 10px rgba(0,0,0,0.55)',
            }}
          >
            "{review.reviewText}"
          </div>
        )}

        {/* Read row */}
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 10 }}
        >
          <span
            style={{
              fontSize: 11,
              color: '#F7931E',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textShadow: '0 1px 6px rgba(0,0,0,0.45)',
            }}
          >
            Read review →
          </span>
          {isOwnPost && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this post?')) onDelete();
              }}
              aria-label="More options"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
