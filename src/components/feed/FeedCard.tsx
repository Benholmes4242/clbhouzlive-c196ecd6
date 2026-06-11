/**
 * FeedCard — Phases 1 & 2
 *
 * Single post = single card. Header, media block, body, footer.
 *
 * Media block:
 *  - Single media → adaptive frame (frame ratio = media's true ratio →
 *    `object-fit: cover` fills with zero crop and zero letterbox). Extreme
 *    ratios are clamped + ambient-filled with a blurred backdrop.
 *  - Multi media → `MediaCarousel`: stable 4:5 frame for all slides
 *    (height never jumps), per-slide blurred ambient backdrop + contained
 *    image/video, dots + n/total chip, swipe navigation, persisted index.
 *
 * Inline video lifecycle is driven by the `isActive` prop from `CardFeed`
 * (most-in-view card). Only one inline video plays at a time across the
 * whole feed; tapping any media opens the immersive `FullscreenFeedOverlay`.
 */
import React, { useMemo } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { FeedPost } from '@/components/media-system/types/media';
import { InlineVideo } from './InlineVideo';
import { MediaCarousel } from './MediaCarousel';

const T100 = 'rgba(255,255,255,0.96)';
const T60 = 'rgba(255,255,255,0.55)';
const T40 = 'rgba(255,255,255,0.38)';
const CARD = '#0F1419';
const LINE = 'rgba(255,255,255,0.07)';
const AMBER = '#F7931E';
const GREEN = '#4ADE80';

const RATIO_MIN = 0.8;   // tallest allowed = 4:5 (portrait capped)
const RATIO_MAX = 1.91;  // widest = ~cinematic landscape
const FALLBACK_RATIO = 4 / 5;

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!isFinite(t)) return '';
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}

export interface FeedCardProps {
  post: FeedPost;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: (post: FeedPost) => void;
  onComment: (post: FeedPost) => void;
  onShare: (post: FeedPost) => void;
  onOpenMedia: (post: FeedPost, mediaIndex: number) => void;
  onProfile: (post: FeedPost) => void;
  onReviewTap?: (post: FeedPost) => void;
  onCourse?: (post: FeedPost) => void;
  /** True when this card is the most-in-view → drives inline video autoplay. */
  isActive?: boolean;
  /**
   * Whether this card should actually mount a `<video>` element. iOS WebViews
   * cap concurrent `<video>` decoders, so we only mount the active card +
   * immediate neighbours; other cards show the thumbnail poster only.
   */
  mountVideo?: boolean;
  /** Initial carousel slide for multi-media posts (from persisted store). */
  initialMediaIndex?: number;
  /** Notified when user swipes the multi-media carousel. */
  onCarouselIndexChange?: (post: FeedPost, idx: number) => void;
}

const FeedCardImpl: React.FC<FeedCardProps> = ({
  post,
  liked,
  likeCount,
  commentCount,
  onLike,
  onComment,
  onShare,
  onOpenMedia,
  onProfile,
  onReviewTap,
  onCourse,
  isActive = false,
  mountVideo = false,
  initialMediaIndex = 0,
  onCarouselIndexChange,
}) => {
  const items = post.mediaItems ?? [];
  const isMulti = items.length > 1;
  const media = items[0];

  const ratio = useMemo(() => {
    if (!media || !media.width || !media.height) return FALLBACK_RATIO;
    const r = media.width / media.height;
    return Math.min(RATIO_MAX, Math.max(RATIO_MIN, r));
  }, [media]);

  const reviewRating = post.review?.rating ?? null;
  const isDeal = post.actorType === 'business';

  const subLine = useMemo(() => {
    const parts: string[] = [];
    if (post.isReview) parts.push('posted a review');
    else if (isDeal) parts.push('Sponsored');
    else if (post.creatorRelation === 'system') parts.push('clbhouz');
    parts.push(timeAgo(post.createdAt));
    return parts.filter(Boolean).join(' · ');
  }, [post, isDeal]);

  const mediaUrl = media?.imageUrl || media?.thumbnailUrl || '';

  return (
    <article
      style={{
        background: CARD,
        overflow: 'hidden',
        marginInline: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <button
          type="button"
          onClick={() => onProfile(post)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <SquircleAvatar src={post.avatarUrl} alt={post.displayName} size={34} hideRing />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={() => onProfile(post)}
            style={{
              display: 'block',
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              fontSize: 14,
              fontWeight: 700,
              color: T100,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              cursor: 'pointer',
            }}
          >
            {post.displayName}
          </button>
          <div style={{ fontSize: 11, color: T40, marginTop: 1 }}>{subLine}</div>
        </div>

        {/* Right chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isDeal && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: GREEN,
                border: `1px solid ${GREEN}`,
                padding: '3px 6px',
                borderRadius: 4,
              }}
            >
              DEAL
            </span>
          )}
          {reviewRating != null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReviewTap?.(post);
              }}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: T100,
                background: 'rgba(255,255,255,0.12)',
                border: `1px solid rgba(255,255,255,0.28)`,
                padding: '3px 7px',
                borderRadius: 999,
                cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              REVIEW {reviewRating.toFixed(1)}
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      {isMulti ? (
        <MediaCarousel
          items={items}
          isCardActive={isActive}
          initialIndex={initialMediaIndex}
          mountVideo={mountVideo}
          onIndexChange={(idx) => onCarouselIndexChange?.(post, idx)}
          onOpen={(idx) => onOpenMedia(post, idx)}
        />
      ) : media ? (
        <button
          type="button"
          onClick={() => onOpenMedia(post, 0)}
          style={{
            display: 'block',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: String(ratio),
              overflow: 'hidden',
              background: '#05080F',
            }}
          >
            {media.type === 'video' ? (
              mountVideo ? (
                <InlineVideo
                  item={media}
                  isActive={isActive}
                  objectFit="cover"
                />
              ) : media.thumbnailUrl ? (
                <img
                  src={media.thumbnailUrl}
                  alt={post.caption || post.displayName}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              ) : null
            ) : mediaUrl ? (
              <img
                src={mediaUrl}
                alt={post.caption || post.displayName}
                loading="lazy"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            ) : null}
          </div>
        </button>
      ) : null}

      {/* Course eyebrow + location (above caption) */}
      {post.courseName && (() => {
        const courseLocation = [post.courseRegion || post.courseSubCountry, post.courseCountry]
          .filter(Boolean)
          .join(', ');
        const handleCourseTap = (e: React.MouseEvent) => {
          e.stopPropagation();
          onCourse?.(post);
        };
        const showRating = post.courseRating != null;
        return (
          <div
            style={{
              padding: '10px 14px 0',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <div style={{ minWidth: 0 }}>
              {post.courseId ? (
                <button
                  type="button"
                  onClick={handleCourseTap}
                  style={{
                    display: 'block',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    fontSize: 12,
                    color: T60,
                    cursor: 'pointer',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {post.courseName}
                </button>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: T60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {post.courseName}
                </div>
              )}
              {courseLocation && (
                <div
                  style={{
                    fontSize: 11,
                    color: T60,
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {courseLocation}
                </div>
              )}
            </div>
            {showRating && (
              <button
                type="button"
                onClick={post.courseId ? handleCourseTap : undefined}
                aria-label={`Community rating ${post.courseRating!.toFixed(1)}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '4px 9px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: post.courseId ? 'pointer' : 'default',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                <img
                  src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 14, height: 14, objectFit: 'contain' }}
                />
                {post.courseRating!.toFixed(1)}
              </button>
            )}
          </div>
        );
      })()}

      {/* Body — caption */}
      {post.caption && (
        <div style={{ padding: '8px 14px 4px' }}>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.4,
              color: T100,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.caption}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 12px',
        }}
      >
        <div>
          {post.isReview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReviewTap?.(post);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: T100,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Read review ›
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <FooterButton
            icon={Heart}
            label={formatCount(likeCount)}
            active={liked}
            onClick={() => onLike(post)}
            activeColor={AMBER}
          />
          <FooterButton
            icon={MessageCircle}
            label={formatCount(commentCount)}
            onClick={() => onComment(post)}
          />
          <FooterButton icon={Share} onClick={() => onShare(post)} />
        </div>
      </div>
    </article>
  );
};

const FooterButton: React.FC<{
  icon: React.ComponentType<any>;
  label?: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
}> = ({ icon: Icon, label, onClick, active, activeColor }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'transparent',
      border: 'none',
      padding: 0,
      color: active ? activeColor ?? T100 : T60,
      cursor: 'pointer',
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    <Icon
      size={20}
      strokeWidth={1.75}
      color={active ? activeColor ?? T100 : T60}
      fill={active ? activeColor ?? 'none' : 'none'}
    />
    {label && <span>{label}</span>}
  </button>
);

export const FeedCard = React.memo(FeedCardImpl);
FeedCard.displayName = 'FeedCard';
