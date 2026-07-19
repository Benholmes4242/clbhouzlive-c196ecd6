/**
 * LivePreviewCard — the signature feed-card preview that assembles as the
 * user fills the composer. Uses white surface, ghost slots (#EEF1F4) for
 * unfilled fields, and shares the exact gold shimmer treatment
 * (clbhouz-gold-shimmer-light + HERO_NUMBER_STYLE) at overall >= 9.0.
 *
 * NO HEADLINE — reviews render body text only.
 */

import React from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import {
  getRatingTier,
  HERO_NUMBER_STYLE,
  ratingTextColor,
} from '@/lib/ratingTier';
import {
  ReviewGhostNumeral,
  ReviewVerdictLabel,
} from '@/components/shared/ReviewGhostScore';
import { RV2, type VerdictSlug } from '../tokens';
import type { CategoryKey, MediaItem, ReviewV2Course } from '../types';

interface Author {
  displayName: string;
  avatarUrl?: string | null;
}

interface Props {
  course: ReviewV2Course | null;
  author: Author;
  overall: number | null;
  verdict: VerdictSlug | null;
  reviewText: string;
  scores: Record<CategoryKey, number | null>;
  media: MediaItem[];
  /** 'light' (default) preserves composer preview; 'dark' remaps for the immersive success screen. */
  surface?: 'light' | 'dark';
}

// Palette per surface. Dark remaps card bg, hairlines, ink, mute, and ghost
// slots for legibility over the immersive #0A0B0D base. Rating text colours
// and catGold shimmer are unchanged (amber reads on dark).
type Palette = {
  cardBg: string;
  hairline: string;
  ink: string;
  mute: string;
  ghost: string;
  ghostBorder: string | null;
  clampFadeStart: string;
  clampFadeEnd: string;
  cardShadow: string;
  verdictSurface: 'light' | 'dark';
};

const LIGHT_PAL: Palette = {
  cardBg: RV2.cardBg,
  hairline: RV2.hairline,
  ink: '#0F172A',
  mute: 'rgba(15,23,42,0.55)',
  ghost: RV2.ghost,
  ghostBorder: null,
  clampFadeStart: 'rgba(255,255,255,0)',
  clampFadeEnd: 'rgba(255,255,255,1)',
  cardShadow: '0 1px 3px rgba(15,23,42,0.04)',
  verdictSurface: 'light',
};

const DARK_PAL: Palette = {
  cardBg: 'rgba(255,255,255,0.05)',
  hairline: 'rgba(255,255,255,0.09)',
  ink: 'rgba(255,255,255,0.96)',
  mute: 'rgba(255,255,255,0.62)',
  ghost: 'rgba(255,255,255,0.05)',
  ghostBorder: 'rgba(255,255,255,0.08)',
  clampFadeStart: 'rgba(10,11,13,0)',
  clampFadeEnd: 'rgba(10,11,13,0.92)',
  cardShadow: '0 1px 3px rgba(0,0,0,0.35)',
  verdictSurface: 'dark',
};

const REVIEW_FONT_SIZE = 14;
const REVIEW_LINE_HEIGHT = 1.4;
const REVIEW_CLAMP_LINES = 3;
const REVIEW_BODY_MIN_HEIGHT =
  REVIEW_FONT_SIZE * REVIEW_LINE_HEIGHT * REVIEW_CLAMP_LINES; // 58.8px


const CAT_LABELS: { key: CategoryKey; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'condition', label: 'Condition' },
  { key: 'clubhouse', label: 'Clubhouse' },
  { key: 'facilities', label: 'Facilities' },
];

function Ghost({
  width,
  height,
  pal,
  radius = RV2.ghostRadius,
  style,
}: {
  width: number | string;
  height: number;
  pal: Palette;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius: radius,
        background: pal.ghost,
        border: pal.ghostBorder ? `1px solid ${pal.ghostBorder}` : undefined,
        ...style,
      }}
    />
  );
}

function ClampedReviewText({ text, pal }: { text: string; pal: Palette }) {
  const textRef = React.useRef<HTMLDivElement | null>(null);
  const [isClamped, setIsClamped] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div style={{ position: 'relative', minHeight: REVIEW_BODY_MIN_HEIGHT }}>
      <div
        ref={textRef}
        style={{
          fontSize: REVIEW_FONT_SIZE,
          lineHeight: REVIEW_LINE_HEIGHT,
          color: pal.ink,
          display: '-webkit-box',
          WebkitLineClamp: REVIEW_CLAMP_LINES,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        <MentionText text={text} />
      </div>
      {isClamped && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            paddingLeft: 64,
            background: `linear-gradient(90deg, ${pal.clampFadeStart} 0%, ${pal.clampFadeEnd} 38%)`,
            color: pal.mute,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: REVIEW_LINE_HEIGHT,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          Read review &gt;
        </span>
      )}
    </div>
  );
}



export function LivePreviewCard({

  course,
  author,
  overall,
  verdict,
  reviewText,
  scores,
  media,
  surface = 'light',
}: Props) {
  void verdict;
  const pal = surface === 'dark' ? DARK_PAL : LIGHT_PAL;

  return (
    <article
      style={{
        position: 'relative',
        background: pal.cardBg,
        borderRadius: RV2.cardRadius,
        border: `1px solid ${pal.hairline}`,
        overflow: 'hidden',
        boxShadow: pal.cardShadow,
      }}
    >
      {/* Ghost numeral — shared component ensures parity with feed/clubhouse. */}
      {overall != null && (
        <ReviewGhostNumeral rating={overall} fontSize={96} right={-8} top={26} />
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px 4px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <SquircleAvatar
          src={author.avatarUrl ?? undefined}
          alt={author.displayName}
          size={34}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: pal.ink,
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {author.displayName || 'You'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 2,
            }}
          >
            <span style={{ fontSize: 11, color: pal.mute }}>Just now</span>
          </div>
        </div>

        {/* Right chip — verdict label sits over the ghost numeral, parity with FeedCard */}
        {overall != null && (
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ReviewVerdictLabel rating={overall} fontSize={11} surface={pal.verdictSurface} />
          </div>
        )}
      </div>


      {/* Review body */}
      <div style={{ padding: '4px 14px 10px', position: 'relative', zIndex: 2 }}>
        {reviewText.trim().length > 0 ? (
          <ClampedReviewText text={reviewText} pal={pal} />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: REVIEW_BODY_MIN_HEIGHT,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: REVIEW_FONT_SIZE,
                lineHeight: REVIEW_LINE_HEIGHT,
                color: pal.mute,
                fontStyle: 'italic',
              }}
            >
              Your review will appear here as you type...
            </div>
          </div>
        )}
      </div>


      {/* Media strip — only when media added */}
      {media.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            padding: '2px 14px 10px',
            scrollbarWidth: 'none',
          }}
        >
          {media.slice(0, 6).map((m) => (
            <div
              key={m.id}
              style={{
                position: 'relative',
                width: 96,
                height: 96,
                borderRadius: 10,
                overflow: 'hidden',
                background: pal.ghost,
                flexShrink: 0,
                border: `1px solid ${pal.hairline}`,
              }}
            >
              {m.type === 'image' ? (
                <img
                  src={m.previewUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : m.posterUrl ? (
                <img
                  src={m.posterUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <video
                  src={m.previewUrl}
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Course eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px 14px',
          borderTop: `1px solid ${pal.hairline}`,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: pal.mute,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Course
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: pal.ink,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {course?.name ?? '—'}
          </div>
        </div>

        {/* Category readouts row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {CAT_LABELS.map(({ key, label }) => {
            const v = scores[key];
            const catGold = getRatingTier(v) === 'EXCEPTIONAL';
            return (
              <div key={key} style={{ textAlign: 'center', minWidth: 34 }}>
                {v == null ? (
                  <Ghost width={22} height={14} pal={pal} style={{ margin: '0 auto' }} />
                ) : (
                  <span
                    className={catGold ? 'clbhouz-gold-shimmer-light' : undefined}
                    style={{
                      fontSize: 13,
                      lineHeight: 1,
                      ...HERO_NUMBER_STYLE,
                      ...(catGold ? {} : { color: ratingTextColor(v) }),
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {v.toFixed(1)}
                  </span>
                )}
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: pal.mute,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginTop: 3,
                  }}
                >
                  {label.slice(0, 4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
