/**
 * PostCourseBand - the SINGLE container below a Clubhouse post's media that
 * holds course identity, the three summary figures and the actions row.
 *
 * Full bleed: no radius, no border, no shadow, no horizontal margin. The only
 * chrome is a 1px hairline against the media above and a 1px hairline between
 * row one and the actions row.
 *
 * Row one is ONE tap target (a button) that opens the course stats sheet. The
 * individual figures are never tappable - at 16px they are not reliable
 * targets on a phone, and the sheet explains all three at once.
 *
 * Figures come from the batched `usePostCourseContext` RPC. This component
 * NEVER fetches.
 *
 * Analytics callsite:
 *  - course_band_tapped { course_id, has_your_best, figures }
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatRatingValue } from '@/utils/formatters';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';

/**
 * TONE MAP — the band renders on the dark Clubhouse slab AND on the light
 * profile feed. Every text, chevron, separator and difficulty-tail colour
 * resolves through here; nothing in the band hardcodes a colour.
 * The dark column is the shipped set verbatim, so dark stays pixel-identical.
 */
export type CourseBandTone = 'dark' | 'light';

interface ToneMap {
  ink: string;
  mute: string;
  dim: string;
  faint: string;
  hairline: string;
  over: string;
  under: string;
  bestFigure: string;
}

const TONES: Record<CourseBandTone, ToneMap> = {
  dark: {
    ink: '#F8FAFC',
    mute: 'rgba(248,250,252,0.62)',
    dim: 'rgba(248,250,252,0.42)',
    faint: 'rgba(248,250,252,0.28)',
    hairline: 'rgba(255,255,255,0.10)',
    over: '#EF4444',
    under: '#5EE9A6',
    bestFigure: '#F7931E',
  },
  light: {
    ink: '#0E1216',
    mute: '#68707B',
    dim: '#A2A9B2',
    faint: '#A2A9B2',
    hairline: 'rgba(14,18,22,0.08)',
    over: '#C8372B',
    under: '#0F8F4A',
    // ~13px figure on white: amber-DEEP per the contrast rule, not #F7931E.
    bestFigure: '#C2620A',
  },
};
/** Solid feed card surface, used to keep the actions row off the photo backdrop. */
const OPAQUE_SURFACE = '#10151C';

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const figureValueStyle: React.CSSProperties = {
  // SF Pro tabular numerals rather than the mono stack: Menlo/Consolas draw a
  // slashed zero by default, which the "zero" feature flag cannot switch off.
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1,
};

const figureLabelStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

export interface CourseBandFigure {
  key: string;
  /** Small dim word ahead of the figure. Only the difficulty branch sets it. */
  prefix?: string;
  figure: string;
  label: string;
  color: string;
}

/**
 * ONE contextual figure per card, first match wins:
 *  1 viewer has played it        -> their best, amber
 *  2 fewer than 3 rounds tracked -> the round count, muted (no difficulty)
 *  3 otherwise                   -> field avg over par, with a tail percentile
 * No tracked rounds at all -> null, and the row is not tappable.
 */
export function pickCourseBandFigure(
  ctx: PostCourseContext | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
  tone: CourseBandTone = 'dark',
): CourseBandFigure | null {
  const C = TONES[tone];
  const rounds = ctx?.rounds_tracked ?? 0;
  if (!ctx || rounds <= 0) return null;

  if ((ctx.your_rounds ?? 0) > 0 && ctx.your_best != null) {
    return {
      key: 'your-best',
      figure: String(ctx.your_best),
      label: t('feed.courseBand.yourBestHere'),
      color: C.bestFigure,
    };
  }

  if (rounds < 3 || ctx.avg_over_par == null || ctx.harder_than_pct == null) {
    return {
      key: 'rounds',
      figure: String(rounds),
      // count is passed as a NUMBER so i18next can pluralise (_one/_other).
      label: t('feed.courseBand.roundTracked', { count: rounds }),
      color: C.mute,
    };
  }

  const HARD_TAIL = 85;
  const EASY_TAIL = 15;

  // harder_than_pct is the share of courses this one is HARDER than, so the
  // two tails are NOT the same sum: hardest is 100 - pct, easiest is pct.
  // Both clamp at 1 - "top 0% hardest" is not a sentence.
  let label: string;
  let color: string;
  if (ctx.harder_than_pct >= HARD_TAIL) {
    label = t('feed.courseBand.topHardest', {
      pct: Math.max(1, 100 - ctx.harder_than_pct),
    });
    color = C.over;
  } else if (ctx.harder_than_pct <= EASY_TAIL) {
    label = t('feed.courseBand.topEasiest', {
      pct: Math.max(1, ctx.harder_than_pct),
    });
    color = C.under;
  } else {
    // Between the tails a percentile states nothing, so it is withheld and the
    // sample size takes the slot instead.
    label = t('feed.courseBand.roundTracked', { count: rounds });
    color = C.mute;
  }

  return {
    key: 'difficulty',
    prefix: t('feed.courseBand.fieldAvg'),
    // No '+' sign: scorecard notation made this read as the poster's score.
    figure: `${ctx.avg_over_par.toFixed(1)}`,
    label,
    color,
  };
}

interface Props {
  courseName: string | null | undefined;
  courseLocation?: string | null;
  courseRating?: number | null;
  ctx?: PostCourseContext | null;
  /** Opens the course stats sheet. Not wired when there is no figure. */
  onOpenStats?: () => void;
  /** The existing actions row, attached to the same container. */
  actions: React.ReactNode;
  /** Extra content (C3 you-vs-them row) rendered under row one. */
  extra?: React.ReactNode;
  /** 'glass' when the card carries a photo backdrop. Default 'solid'. */
  surface?: 'solid' | 'glass';
  /** Host surface palette. Default 'dark' (Clubhouse slab); the light profile
   *  feed passes 'light'. Named `tone` because `surface` already means
   *  solid-vs-glass (media context), which is an orthogonal question. */
  tone?: CourseBandTone;
}

export const PostCourseBand: React.FC<Props> = ({
  courseName,
  courseLocation,
  courseRating,
  ctx,
  onOpenStats,
  actions,
  extra,
  surface = 'solid',
  tone = 'dark',
}) => {
  const { t } = useTranslation('common');
  const C = TONES[tone];

  const hasYourBest = (ctx?.your_rounds ?? 0) > 0 && ctx?.your_best != null;
  const figure = pickCourseBandFigure(ctx, t, tone);

  // Prefer ctx: it is keyed off resolvePostCourseId (course_id, else the first
  // golf_club tag), which is the SAME course line 2's figures describe. The
  // courseRating prop comes from the feed payload's course_avg_overall_score,
  // joined via review_course_id-or-course_id, and is absent on tag-only posts.
  const rating = ctx?.community_rating ?? courseRating ?? null;

  const tappable = !!figure && !!onOpenStats;

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tappable) return;
    analyticsEvents.track('course_band_tapped', {
      course_id: ctx?.course_id ?? null,
      has_your_best: hasYourBest,
      figures: figure ? 1 : 0,
    });
    onOpenStats?.();
  };

  const line1 = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        lineHeight: 1.05,
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14.5,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          lineHeight: 1.05,
          color: C.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {courseName}
      </div>
      {rating != null ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          <img
            src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
            alt=""
            aria-hidden="true"
            style={{ width: 10, height: 10, objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: 11.5,
              fontFamily: MONO,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              color: C.mute,
              lineHeight: 1,
            }}
          >
            {formatRatingValue(rating)}
          </span>
        </span>
      ) : null}
    </div>
  );

  const line2 = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        marginTop: 4,
        lineHeight: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        {courseLocation ? (
          <span
            style={{
              fontSize: 12,
              lineHeight: 1,
              color: C.dim,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {courseLocation}
          </span>
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      {figure && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            flexShrink: 0,
          }}
        >
          {figure.prefix ? (
            <span style={{ ...figureLabelStyle, color: C.faint }}>
              {figure.prefix}
            </span>
          ) : null}
          <span style={{ ...figureValueStyle, color: figure.color }}>
            {figure.figure}
          </span>
          {figure.prefix ? (
            <span style={{ ...figureLabelStyle, color: C.faint, fontSize: 11 }}>
              {'\u00B7'}
            </span>
          ) : null}
          <span style={{ ...figureLabelStyle, color: C.dim }}>{figure.label}</span>
        </div>
      )}

      {tappable && (
        <ChevronRight
          size={16}
          color={C.dim}
          // Optical alignment with the community rating on line 1. lucide
          // leaves ~5px of dead space right of the glyph inside its 16px box,
          // so the box edges align but the ink does not. Pull it out by 4.
          style={{ flexShrink: 0, marginLeft: 'auto', marginRight: -4 }}
        />
      )}
    </div>
  );

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
    width: '100%',
    textAlign: 'left',
    padding: '9px 14px 10px',
    background: 'transparent',
    border: 'none',
  };

  const glass = surface === 'glass';

  return (
    <div
      style={{
        background: 'transparent',
        borderTop: `1px solid ${C.hairline}`,
      }}
    >
      {tappable ? (
        <button
          type="button"
          onClick={handleTap}
          className="active:opacity-70"
          style={{ ...rowStyle, cursor: 'pointer' }}
        >
          {line1}
          {line2}
        </button>
      ) : (
        <div style={rowStyle}>
          {line1}
          {line2}
        </div>
      )}

      {extra ? <div style={{ padding: '0 14px 8px' }}>{extra}</div> : null}

      {/* In glass mode the actions row is the ONE opaque block: the photo
          backdrop stops here. */}
      <div
        style={{
          borderTop: `1px solid ${C.hairline}`,
          background: glass ? OPAQUE_SURFACE : undefined,
        }}
      >
        {actions}
      </div>
    </div>
  );
};

export default PostCourseBand;
