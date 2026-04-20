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
  likeState?: { isLiked: boolean; count: number };
  onLike?: () => void;
  onComment?: () => void;
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

  return (
    <div
      ref={tileRef}
      className="relative overflow-hidden cursor-pointer"
      style={{
        background: '#0F172A',
        borderTop: '0.5px solid rgba(247,147,30,0.25)',
        borderBottom: '0.5px solid rgba(247,147,30,0.25)',
      }}
      onClick={() => {
        if (allPosts && postIndex != null) {
          useFullscreenFeedStore.getState().open(allPosts, postIndex);
        }
      }}
    >
      {/* Amber accent bar */}
      <div
        style={{
          height: 2,
          background: 'linear-gradient(90deg, #F7931E 0%, transparent 70%)',
        }}
      />

      {/* Media — 16:10 */}
      <div className="relative w-full bg-slate-700" style={{ aspectRatio: '16 / 10' }}>
        {courseImageUrl && (
          <img
            src={courseImageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(0deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.2) 50%, transparent 100%)',
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

        {/* Course name + location — bottom-left */}
        <div className="absolute" style={{ left: 14, right: 100, bottom: 12 }}>
          <div
            className="text-white font-black"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 22,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
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
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              {locationLine}
            </div>
          )}
        </div>
      </div>

      {/* Body — excerpt + read row */}
      <div
        className="px-3.5 pt-2.5 pb-3.5"
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #0B1220 100%)',
        }}
      >
        {review.reviewText && (
          <div
            className="text-white/70 italic line-clamp-2"
            style={{ fontSize: 13, lineHeight: 1.5 }}
          >
            "{review.reviewText}"
          </div>
        )}
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 8 }}
        >
          <span
            style={{ fontSize: 11, color: '#F7931E', fontWeight: 600 }}
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
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
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
