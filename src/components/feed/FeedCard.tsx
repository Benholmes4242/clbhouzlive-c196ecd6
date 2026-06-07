/**
 * FeedCard — Phase 1
 *
 * Single post = single card. Adaptive media frame: the frame's aspect-ratio
 * equals the media's own ratio so `object-fit: cover` fills with zero crop
 * and zero letterbox. Extreme ratios are clamped + ambient-filled with a
 * blurred backdrop.
 *
 * Phase 1 scope:
 *  - Header (avatar / name / sub-line / optional REVIEW pill / DEAL chip)
 *  - Single-media adaptive frame (first mediaItem only)
 *  - Footer (like / comment / share)
 *  - Tap on media → open `useFullscreenFeedStore` at the right post/slide
 *
 * Phase 2 (later): multi-media carousel with dots, inline video lifecycle.
 */
import React, { useMemo } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { FeedPost } from '@/components/media-system/types/media';

const T100 = 'rgba(255,255,255,0.96)';
const T60 = 'rgba(255,255,255,0.55)';
const T40 = 'rgba(255,255,255,0.38)';
const CARD = '#0F1419';
const LINE = 'rgba(255,255,255,0.07)';
const AMBER = '#F7931E';
const GREEN = '#4ADE80';

const RATIO_MIN = 0.5;   // tallest (1:2)
const RATIO_MAX = 1.91;  // widest (cinematic landscape)
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
}) => {
  const media = post.mediaItems?.[0];

  const { ratio, isContained } = useMemo(() => {
    if (!media || !media.width || !media.height) {
      return { ratio: FALLBACK_RATIO, isContained: false };
    }
    const r = media.width / media.height;
    if (r < RATIO_MIN) return { ratio: RATIO_MIN, isContained: true };
    if (r > RATIO_MAX) return { ratio: RATIO_MAX, isContained: true };
    return { ratio: r, isContained: false };
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
        borderRadius: 16,
        border: `0.5px solid ${LINE}`,
        overflow: 'hidden',
        marginInline: 8,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <button
          type="button"
          onClick={() => onProfile(post)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <SquircleAvatar src={post.avatarUrl} alt={post.displayName} size={34} />
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
                color: AMBER,
                background: 'rgba(247,147,30,0.12)',
                border: `1px solid rgba(247,147,30,0.35)`,
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
      {media && (
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
            {isContained && mediaUrl && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${mediaUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(26px) brightness(0.5) saturate(1.25)',
                  transform: 'scale(1.25)',
                }}
              />
            )}
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt={post.caption || post.displayName}
                loading="lazy"
                style={{
                  position: 'absolute',
                  inset: 0,
                  margin: 'auto',
                  width: '100%',
                  height: '100%',
                  objectFit: isContained ? 'contain' : 'cover',
                  display: 'block',
                }}
              />
            )}
            {media.type === 'video' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    background: 'rgba(5,8,16,0.55)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '10px solid transparent',
                      borderBottom: '10px solid transparent',
                      borderLeft: '16px solid #fff',
                      marginLeft: 4,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </button>
      )}

      {/* Body — caption */}
      {post.caption && (
        <div style={{ padding: '10px 14px 4px' }}>
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
          {post.courseName && (
            <div style={{ fontSize: 12, color: T60, marginTop: 4 }}>{post.courseName}</div>
          )}
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
                color: AMBER,
                fontSize: 13,
                fontWeight: 600,
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
  icon: React.ComponentType<{ size?: number; color?: string; fill?: string; strokeWidth?: number }>;
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
