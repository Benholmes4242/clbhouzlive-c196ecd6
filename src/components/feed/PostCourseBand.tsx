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
    bestFigure: '#F8FAFC',
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
  figure: string;
  label: string;
  color: string;
}

/**
 * ONE contextual figure per card, first match wins:
 *  1 viewer has played it -> their best, amber
 *  2 otherwise            -> the tracked-round count, muted
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

  return {
    key: 'rounds',
    figure: String(rounds),
    // count is passed as a NUMBER so i18next can pluralise (_one/_other).
    label: t('feed.courseBand.roundTracked', { count: rounds }),
    color: C.mute,
  };
}

interface Props {
  courseName: string | null | undefined;
  /**
   * THE COURSE NAME IS A DOOR (Ben, 15 Sep 2026). Passed ONLY when the card
   * carries a real course id: the name then routes to that course's page and
   * stops the event so no host handler (media tap, band stats sheet, round
   * sheet) also fires. Absent -> the name is plain text with no tap target.
   * There is NO name lookup fallback; routing from a name string is the exact
   * fault the course-matcher work removed.
   */
  onOpenCourse?: () => void;
  courseLocation?: string | null;
  courseRating?: number | null;
  ctx?: PostCourseContext | null;
  /** Opens the course stats sheet. Not wired when there is no figure. */
  onOpenStats?: () => void;
  /**
   * DEAD SLOT (BRIEF_FEED_CARD_REBUILD section A). The actions row is now one
   * always-present footer owned by FeedCard, rendered AFTER this band, so no
   * caller passes `actions` any more. The branch below is retained verbatim
   * and recorded on the dead-code list; it is swept with the rest.
   */
  actions?: React.ReactNode;

  /** Extra content (C3 you-vs-them row) rendered under row one. */
  extra?: React.ReactNode;
  /** 'glass' when the card carries a photo backdrop. Default 'solid'. */
  surface?: 'solid' | 'glass';
  /**
   * BRIEF_CLUBHOUSE_REVIEW_POST_ONE_DESTINATION §1-2. Review post cards pass
   * true: the band states the course name and its place and NOTHING else — no
   * community rating chip, no contextual figure ("field avg 3.4 / top 10%
   * hardest"), no chevron, and no tap. A review card has one destination and it
   * is the review sheet, so the band cannot be a second door.
   *
   * Default false — every other post kind keeps the shipped band verbatim.
   */
  identityOnly?: boolean;
  /** Host surface palette. Default 'dark' (Clubhouse slab); the light profile
   *  feed passes 'light'. Named `tone` because `surface` already means
   *  solid-vs-glass (media context), which is an orthogonal question. */
  tone?: CourseBandTone;
}

export const PostCourseBand: React.FC<Props> = ({
  courseName,
  onOpenCourse,
  courseLocation,
  courseRating,
  ctx,
  onOpenStats,
  actions,
  extra,
  surface = 'solid',
  tone = 'dark',
  identityOnly = false,
}) => {
  const { t } = useTranslation('common');
  const C = TONES[tone];

  const hasYourBest = (ctx?.your_rounds ?? 0) > 0 && ctx?.your_best != null;
  const figure = identityOnly ? null : pickCourseBandFigure(ctx, t, tone);

  // Prefer ctx: it is keyed off resolvePostCourseId (course_id, else the first
  // golf_club tag), which is the SAME course line 2's figures describe. The
  // courseRating prop comes from the feed payload's course_avg_overall_score,
  // joined via review_course_id-or-course_id, and is absent on tag-only posts.
  const rating = identityOnly ? null : (ctx?.community_rating ?? courseRating ?? null);

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
      {/* THE NAME IS THE TAP TARGET, never the whole band and never the place
          line. Rendered as a role="link" span rather than a <button> because
          the band row itself may already BE a button when the stats sheet is
          wired, and a nested button is invalid. The affordance is the small
          chevron pinned to the name's own text, not an underline. */}
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
        {onOpenCourse ? (
          <span
            role="link"
            tabIndex={0}
            className="active:opacity-60"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              analyticsEvents.track('course_name_tapped', {
                course_id: ctx?.course_id ?? null,
                surface: identityOnly ? 'review_post' : 'post',
              });
              onOpenCourse();
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.stopPropagation();
              e.preventDefault();
              onOpenCourse();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              maxWidth: '100%',
              cursor: 'pointer',
              color: C.ink,
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {courseName}
            </span>
            <ChevronRight size={13} color={C.mute} aria-hidden style={{ flexShrink: 0, marginLeft: -1 }} />
          </span>
        ) : (
          courseName
        )}
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
          <span style={{ ...figureValueStyle, color: figure.color }}>
            {figure.figure}
          </span>
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

      {/* DEAD BRANCH (section A). In glass mode the actions row was the ONE
          opaque block: the photo backdrop stopped here. No caller passes
          `actions`, so nothing renders and no empty bordered block is left. */}
      {actions ? (
        <div
          style={{
            borderTop: `1px solid ${C.hairline}`,
            background: glass ? OPAQUE_SURFACE : undefined,
          }}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
};

export default PostCourseBand;
