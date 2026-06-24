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
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Heart, MapPin, MessageCircle, Share } from 'lucide-react';
import { PostOwnerMenu } from '@/components/posts/PostOwnerMenu';
import { useManageableBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRatingTier, getRatingTierLabel } from '@/lib/ratingTier';
import { formatRatingValue } from '@/utils/formatters';

import type { FeedPost } from '@/components/media-system/types/media';
import { InlineVideo } from './InlineVideo';
import { MediaCarousel } from './MediaCarousel';
import { FeedFollowPill } from './FeedFollowPill';

// Full-bleed ink chrome — one ink (#0F172A) across the app: tab underline,
// primary text base, and the feed card surface all share this token. Text
// constants flip to light-on-dark; LINE becomes a white hairline.
const CARD = '#0F172A';
const T100 = '#F8FAFC';
const T60 = 'rgba(248,250,252,0.65)';
const T40 = 'rgba(248,250,252,0.45)';
const LINE = 'rgba(255,255,255,0.08)';
const AMBER = '#F7931E';
const GREEN = '#22C55E';

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
  onFollow?: (post: FeedPost) => void;
  currentUserId?: string;
  /** Feed index — threaded down to InlineVideo for greppable per-tile traces. */
  feedIndex?: number;
}

interface CaptionBlockProps {
  body: string;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isClamped: boolean;
  setIsClamped: (v: boolean) => void;
  textRef: React.MutableRefObject<HTMLDivElement | null>;
}

const CaptionBlock: React.FC<CaptionBlockProps> = ({ body, expanded, setExpanded, isClamped, setIsClamped, textRef }) => {
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Measure against clamped state: when expanded the element has no clamp,
    // so we rely on the previously-measured value to keep "less" available.
    if (!expanded) {
      const clamped = el.scrollHeight > el.clientHeight + 1;
      setIsClamped(clamped);
    }
  }, [body, expanded, setIsClamped, textRef]);

  if (!body) return null;

  return (
    <div style={{ padding: '0px 14px 10px', position: 'relative', zIndex: 2, marginTop: -6 }}>
      <div style={{ position: 'relative' }}>
        <div
          ref={textRef}
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            color: T100,
            ...(expanded
              ? {}
              : {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }),
          }}
        >
          {body}
          {expanded && isClamped && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              style={{
                background: 'transparent', border: 'none', padding: 0, marginLeft: 6,
                color: T60, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              less
            </button>
          )}
        </div>
        {!expanded && isClamped && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              paddingLeft: 28,
              background: 'linear-gradient(90deg, rgba(15,23,42,0) 0%, #0F172A 40%)',
              border: 'none',
              color: T60,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            more
          </button>
        )}
      </div>
    </div>
  );
};


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
  onFollow,
  currentUserId,
  feedIndex,
}) => {
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isCaptionClamped, setIsCaptionClamped] = useState(false);
  const captionTextRef = useRef<HTMLDivElement | null>(null);
  const mountFollowPill =
    !!onFollow &&
    post.actorType === 'personal' &&
    post.creatorRelation !== 'system' &&
    post.userId !== currentUserId;
  const manageableBusinessIds = useManageableBusinessIds(currentUserId);
  const canManage = canManagePost(
    { userId: post.userId, actorType: post.actorType === 'business' ? 'business' : 'personal', actorId: post.actorId },
    currentUserId,
    manageableBusinessIds,
  );
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
        position: 'relative',
        borderTop: `1px solid ${LINE}`,
      }}
    >
      {/* Card-level ghost numeral — overflows the header, clipped by card edges */}
      {reviewRating != null && (() => {
        const GHOST = {
          EXCEPTIONAL: 'rgba(247,147,30,0.14)',
          EXCELLENT:   'rgba(255,255,255,0.08)',
          GOOD:        'rgba(255,255,255,0.06)',
          FAIR:        'rgba(255,255,255,0.05)',
          POOR:        'rgba(255,255,255,0.05)',
        } as const;
        const tierKey = getRatingTier(reviewRating);
        return (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: -7,
              top: 28,
              transform: 'translateY(-50%)',
              fontSize: 110,
              fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1,
              color: GHOST[tierKey],
              pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatRatingValue(reviewRating)}
          </span>
        );
      })()}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 2px', position: 'relative', zIndex: 2 }}>
        <button
          type="button"
          onClick={() => onProfile(post)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <SquircleAvatar src={post.avatarUrl} alt={post.displayName} size={34} hairlineRing />
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
          <div style={{ fontSize: 11, color: T60, marginTop: 1 }}>{subLine}</div>
        </div>

        {/* Right chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {mountFollowPill && (
            <FeedFollowPill
              isFollowed={!!post.isFollowedByMe}
              onFollow={() => onFollow!(post)}
            />
          )}
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
          {reviewRating != null && (() => {
            const LABEL_COLOR = {
              EXCEPTIONAL: '#F7931E',
              EXCELLENT:   T100,
              GOOD:        T60,
              FAIR:        T40,
              POOR:        T40,
            } as const;
            const tierKey = getRatingTier(reviewRating);
            const tierLabel = getRatingTierLabel(reviewRating);
            return (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onReviewTap?.(post); }}
                style={{
                  position: 'relative', zIndex: 3,
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label={`Your review: ${formatRatingValue(reviewRating)} ${tierLabel}`}
              >
                <span style={{
                  fontSize: 12.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: LABEL_COLOR[tierKey], whiteSpace: 'nowrap',
                }}>
                  {tierLabel}
                </span>
              </button>
            );
          })()}
          {/* Owner menu — self-wired Edit / Delete / Manage review.
              Visibility = canManagePost (personal author OR business owner/admin). */}
          {canManage && (
            <PostOwnerMenu
              postId={post.id}
              isOwnPost
              actorType={post.actorType === 'business' ? 'business' : 'personal'}
              actorId={post.actorId}
              sourceReviewId={post.review?.reviewId ?? null}
              reviewCourseId={post.review?.courseId ?? null}
              variant="inline"
            />
          )}
        </div>
      </div>

      {/* Caption — review text above media, overlapping the ghost numeral's lower edge */}
      <CaptionBlock
        body={post.caption || (post.isReview ? post.review?.reviewText ?? '' : '')}
        expanded={captionExpanded}
        setExpanded={setCaptionExpanded}
        isClamped={isCaptionClamped}
        setIsClamped={setIsCaptionClamped}
        textRef={captionTextRef}
      />


      {/* Media */}
      <div style={{ position: 'relative', zIndex: 1 }}>
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
                    isNear={mountVideo}
                    feedIndex={feedIndex}
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
      </div>

      {/* Course eyebrow + location (above caption) */}
      {post.courseName && (() => {
        const courseLocation = [post.courseRegion || post.courseSubCountry, post.courseCountry]
          .filter(Boolean)
          .join(', ');
        const handleCourseTap = (e: React.MouseEvent) => {
          e.stopPropagation();
          onCourse?.(post);
        };
        const pill = post.courseRating != null ? (() => {
          return (
            <button
              type="button"
              onClick={handleCourseTap}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '3px 9px 3px 4px', borderRadius: 999,
                cursor: post.courseId ? 'pointer' : 'default', marginLeft: 8,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <img
                src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
                alt=""
                style={{
                  width: 16, height: 16, flexShrink: 0, objectFit: 'contain',
                }}
                aria-hidden="true"
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: T100, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {formatRatingValue(post.courseRating)}
              </span>
            </button>
          );
        })() : null;
        const nameEl = post.courseId ? (
          <button
            type="button"
            onClick={handleCourseTap}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              fontSize: 13,
              fontWeight: 700,
              color: T100,
              cursor: 'pointer',
              minWidth: 0,
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
              fontSize: 13,
              fontWeight: 700,
              color: T100,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.courseName}
          </div>
        );
        return (
          <div style={{ padding: '10px 14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              {nameEl}
              {pill}
            </div>
            {courseLocation && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 11,
                  color: T60,
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <MapPin size={10} color={T40} style={{ marginRight: 3, flexShrink: 0 }} />
                {courseLocation}
              </div>
            )}
          </div>
        );
      })()}


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
