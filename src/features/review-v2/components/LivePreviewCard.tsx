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
  getRatingTierLabel,
  HERO_NUMBER_STYLE,
  ratingTextColor,
} from '@/lib/ratingTier';
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
}

const T_INK = '#0F172A';
const T_MUTE = 'rgba(15,23,42,0.55)';

const CAT_LABELS: { key: CategoryKey; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'condition', label: 'Condition' },
  { key: 'clubhouse', label: 'Clubhouse' },
  { key: 'facilities', label: 'Facilities' },
];

function Ghost({
  width,
  height,
  radius = RV2.ghostRadius,
  style,
}: {
  width: number | string;
  height: number;
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
        background: RV2.ghost,
        ...style,
      }}
    />
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
}: Props) {
  const tier = getRatingTier(overall);
  const isGold = tier === 'EXCEPTIONAL';
  const tierLabel = overall != null ? getRatingTierLabel(overall) : null;
  void verdict;

  return (
    <article
      style={{
        position: 'relative',
        background: RV2.cardBg,
        borderRadius: RV2.cardRadius,
        border: `1px solid ${RV2.hairline}`,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}
    >
      {/* Ghost numeral — fills in when overall is set. */}
      {overall != null && (
        <span
          aria-hidden
          className={isGold ? 'clbhouz-gold-shimmer-light' : undefined}
          style={{
            position: 'absolute',
            right: -8,
            top: 26,
            transform: 'translateY(-50%)',
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 0,
            fontVariantNumeric: 'tabular-nums',
            ...(isGold
              ? { opacity: 0.32 }
              : { color: 'rgba(247,147,30,0.18)' }),
          }}
        >
          {overall.toFixed(1)}
        </span>
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
              color: T_INK,
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {author.displayName || 'You'}
          </div>
          <div style={{ fontSize: 11, color: T_MUTE, marginTop: 2 }}>Just now</div>
        </div>

        {/* Tier label removed — score numeral + gold shimmer carries the tiering. */}
      </div>


      {/* Verdict chip removed — tier label (top-right) is the derived
          verdict, matching ReviewBottomSheet's ReviewVerdictLabel. */}

      {/* Review body */}
      <div style={{ padding: '4px 14px 10px', position: 'relative', zIndex: 2 }}>
        {reviewText.trim().length > 0 ? (
          <MentionText
            text={reviewText}
            style={{
              fontSize: 14,
              color: T_INK,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Ghost width="100%" height={12} />
            <Ghost width="88%" height={12} />
            <Ghost width="62%" height={12} />
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
                background: RV2.ghost,
                flexShrink: 0,
                border: `1px solid ${RV2.hairline}`,
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
          borderTop: `1px solid ${RV2.hairline}`,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: T_MUTE,
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
              color: T_INK,
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
                  <Ghost width={22} height={14} style={{ margin: '0 auto' }} />
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
                    color: T_MUTE,
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
