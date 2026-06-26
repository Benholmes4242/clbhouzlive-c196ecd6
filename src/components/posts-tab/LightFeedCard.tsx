/**
 * LightFeedCard — light-mode profile feed card.
 *
 * Structural clone of `src/components/feed/FeedCard.tsx`, identical DOM and
 * props interface, with only the palette swapped to sit on the light
 * profile/handicap surface (`#F8FAFC`). All sub-components (SquircleAvatar,
 * MediaCarousel, InlineVideo, FeedFollowPill, FeedActorPicker, PostOwnerMenu)
 * are reused from the Clubhouse feed — do NOT fork them.
 *
 * Clubhouse (dark) FeedCard is unchanged; this file is profile-only.
 */
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, MessageCircle, Share } from 'lucide-react';
import { PostOwnerMenu } from '@/components/posts/PostOwnerMenu';
import { useManageableBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRatingTier, getRatingTierLabel, ratingTextColor } from '@/lib/ratingTier';
import { formatRatingValue } from '@/utils/formatters';
import { useActiveActor } from '@/context/ActiveActorContext';

import type { FeedPost } from '@/components/media-system/types/media';
import { InlineVideo } from '@/components/feed/InlineVideo';
import { MediaCarousel } from '@/components/feed/MediaCarousel';
import { FeedFollowPill } from '@/components/feed/FeedFollowPill';
import { FeedActorPicker } from '@/components/feed/FeedActorPicker';
import type { ActiveActor } from '@/types/actor';

// Light palette — cards sit on the page background (#F8FAFC); dividers are
// a touch darker than bg. Text drops to ink (#0F172A) with proportional
// alpha steps for secondary/tertiary.
const CARD = '#F8FAFC';
const T100 = '#0F172A';
const T60 = 'rgba(15,23,42,0.60)';
const T40 = 'rgba(15,23,42,0.42)';
const LINE = '#E5E7EA';
const MEDIA_LETTERBOX = '#E2E8F0';
const CAPTION_FADE_FROM = 'rgba(248,250,252,0)';
const CAPTION_FADE_TO = '#F8FAFC';
const AMBER = '#F7931E';
const GREEN = '#22C55E';

const RATIO_MIN = 0.8;
const RATIO_MAX = 1.91;
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

export interface LightFeedCardProps {
  post: FeedPost;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: (post: FeedPost, actor?: ActiveActor | null) => void;
  onComment: (post: FeedPost, actor?: ActiveActor | null) => void;
  onShare: (post: FeedPost) => void;
  onOpenMedia: (post: FeedPost, mediaIndex: number) => void;
  onProfile: (post: FeedPost) => void;
  onReviewTap?: (post: FeedPost) => void;
  onCourse?: (post: FeedPost) => void;
  isActive?: boolean;
  mountVideo?: boolean;
  initialMediaIndex?: number;
  onCarouselIndexChange?: (post: FeedPost, idx: number) => void;
  onFollow?: (post: FeedPost) => void;
  currentUserId?: string;
  feedIndex?: number;
}

interface CaptionBlockProps {
  body: string;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isClamped: boolean;
  setIsClamped: (v: boolean) => void;
  textRef: React.MutableRefObject<HTMLDivElement | null>;
  onReadReview?: (e: React.MouseEvent) => void;
}

const CaptionBlock: React.FC<CaptionBlockProps> = ({ body, expanded, setExpanded, isClamped, setIsClamped, textRef, onReadReview }) => {
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (!expanded) {
      const clamped = el.scrollHeight > el.clientHeight + 1;
      setIsClamped(clamped);
    }
  }, [body, expanded, setIsClamped, textRef]);

  const isReviewMode = !!onReadReview;
  const showMore = !isReviewMode && !expanded && isClamped;
  const showReadReview = isReviewMode && !!body;

  if (!body && !showReadReview) return null;

  const fadeGradient = `linear-gradient(90deg, ${CAPTION_FADE_FROM} 0%, ${CAPTION_FADE_TO} 40%)`;
  const fadeGradientWide = `linear-gradient(90deg, ${CAPTION_FADE_FROM} 0%, ${CAPTION_FADE_TO} 38%)`;

  return (
    <div style={{ padding: '0px 14px 10px', position: 'relative', zIndex: 2, marginTop: -1 }}>
      <div style={{ position: 'relative' }}>
        <div
          ref={textRef}
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            color: T100,
            ...((isReviewMode || !expanded)
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
              : {}),
          }}
        >
          {body}
          {!isReviewMode && expanded && isClamped && (
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
        {showMore && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              paddingLeft: 28,
              background: fadeGradient,
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
        {showReadReview && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReadReview!(e); }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              paddingLeft: 64,
              background: fadeGradientWide,
              border: 'none',
              color: T60,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}
          >
            Read review ›
          </button>
        )}
      </div>
    </div>
  );
};

const LightFeedCardImpl: React.FC<LightFeedCardProps> = ({
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
  const navigate = useNavigate();
  const { activeActor, setActiveActor } = useActiveActor();
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isCaptionClamped, setIsCaptionClamped] = useState(false);
  // Actor selection is GLOBAL — picker reads and writes the session-wide activeActor.
  const effectiveActor: ActiveActor | null = activeActor;
  const captionTextRef = useRef<HTMLDivElement | null>(null);

  const reviewCourseId = post.review?.courseId ?? post.courseId;
  const reviewId = post.review?.reviewId;
  const handleReadReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reviewCourseId) return;
    const url = reviewId
      ? `/courses/${reviewCourseId}?tab=reviews&review=${reviewId}`
      : `/courses/${reviewCourseId}?tab=reviews`;
    navigate(url);
  };
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
    if (isDeal) parts.push('Sponsored');
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
        minHeight: 1,
      }}
    >
      {/* Ghost numeral — drop alpha ~30% for contrast on light bg */}
      {reviewRating != null && (() => {
        const GHOST = {
          EXCEPTIONAL: 'rgba(240,165,0,0.20)',    // #F0A500 gold
          EXCELLENT:   'rgba(217,119,6,0.18)',    // #D97706 amber
          GOOD:        'rgba(217,119,6,0.15)',    // #D97706 amber
          FAIR:        'rgba(100,116,139,0.18)',  // #64748B slate
          POOR:        'rgba(100,116,139,0.15)',  // #64748B slate
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
            <span style={{ fontSize: 11, color: T60 }}>{subLine}</span>
            {mountFollowPill && (
              <FeedFollowPill
                isFollowed={!!post.isFollowedByMe}
                onFollow={() => onFollow!(post)}
              />
            )}
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
          {reviewRating != null && (() => {
            const tierLabel = getRatingTierLabel(reviewRating);
            return (
              <button
                type="button"
                onClick={handleReadReview}
                style={{
                  position: 'relative', zIndex: 3,
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label={`Your review: ${formatRatingValue(reviewRating)} ${tierLabel}`}
              >
                <span style={{
                  fontSize: 12.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: ratingTextColor(reviewRating), whiteSpace: 'nowrap',
                }}>
                  {tierLabel}
                </span>
              </button>
            );
          })()}
        </div>
      </div>

      {!(post.caption || (post.isReview && post.review?.reviewText)) && (
        <div aria-hidden style={{ height: 8 }} />
      )}

      <CaptionBlock
        body={post.caption || (post.isReview ? post.review?.reviewText ?? '' : '')}
        expanded={captionExpanded}
        setExpanded={setCaptionExpanded}
        isClamped={isCaptionClamped}
        setIsClamped={setIsCaptionClamped}
        textRef={captionTextRef}
        onReadReview={post.isReview && reviewCourseId ? handleReadReview : undefined}
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
                minHeight: 120,
                overflow: 'hidden',
                background: MEDIA_LETTERBOX,
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

      {/* Course eyebrow + location */}
      {post.courseName && (() => {
        const courseLocation = [post.courseRegion || post.courseSubCountry, post.courseCountry]
          .filter(Boolean)
          .join(', ');
        const handleCourseTap = (e: React.MouseEvent) => {
          e.stopPropagation();
          onCourse?.(post);
        };
        const pill = post.courseRating != null ? (
          <button
            type="button"
            onClick={handleCourseTap}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
              background: 'rgba(15,23,42,0.05)',
              border: '1px solid rgba(15,23,42,0.08)',
              padding: '3px 9px 3px 4px', borderRadius: 999,
              cursor: post.courseId ? 'pointer' : 'default', marginLeft: 8,
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
        ) : null;
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
          <div style={{ padding: '10px 14px 10px' }}>
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

      {/* Footer action bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 12px',
          borderTop: `0.5px solid ${LINE}`,
        }}
      >
        <FeedActorPicker value={activeActor} onChange={(a) => setActiveActor(a)} theme="light" />
        <FooterButton
          icon={Heart}
          label={formatCount(likeCount)}
          active={liked}
          onClick={() => onLike(post, effectiveActor)}
          activeColor={AMBER}
        />
        <FooterButton
          icon={MessageCircle}
          label={formatCount(commentCount)}
          onClick={() => onComment(post, effectiveActor)}
        />
        <FooterButton icon={Share} onClick={() => onShare(post)} />
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
      size={24}
      strokeWidth={1.75}
      color={active ? activeColor ?? T100 : T60}
      fill={active ? activeColor ?? 'none' : 'none'}
    />
    {label && <span>{label}</span>}
  </button>
);

export const LightFeedCard = React.memo(LightFeedCardImpl);
LightFeedCard.displayName = 'LightFeedCard';
