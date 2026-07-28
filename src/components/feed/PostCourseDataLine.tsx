/**
 * PostCourseDataLine — the COURSE STATS panel under a Clubhouse post's
 * course name.
 *
 * Values come from the batched `get_post_course_context` RPC (see
 * `usePostCourseContext`) — this component NEVER fetches. Figures are
 * monospace/tabular, labels are uppercase micro-caps.
 *
 * The panel is the ONE inset element inside a full-bleed post; the post
 * itself never gains card chrome (no radius, border or horizontal margin).
 *
 * Analytics callsites:
 *  - feed_course_line_shown  { has_your_best, has_rounds, cells } — once per
 *    post, on first intersection (never per scroll event).
 *  - feed_course_line_tapped { course_id, has_your_best } — on tap through.
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';

const T60 = 'rgba(248,250,252,0.65)';
const T40 = 'rgba(248,250,252,0.45)';
const T100 = '#F8FAFC';
const RED = '#EF4444';
const AMBER = '#F7931E';
const PANEL_BG = 'rgba(255,255,255,0.045)';
const PANEL_LINE = 'rgba(255,255,255,0.10)';

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const figureStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 17,
  fontWeight: 800,
  letterSpacing: '-0.035em',
  lineHeight: 1.1,
  color: T100,
};

const labelStyle: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: T40,
  lineHeight: 1,
  marginTop: 3,
  whiteSpace: 'nowrap',
};

const smallFigureStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12.5,
  fontWeight: 700,
  color: T100,
  lineHeight: 1,
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T40,
  lineHeight: 1,
};

/** Inline stat used by the C3 you-vs-them row (unchanged). */
const Stat: React.FC<{ figure: string; label: string; color?: string }> = ({
  figure,
  label,
  color,
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
    <span style={{ ...smallFigureStyle, color: color ?? T100 }}>{figure}</span>
    <span style={smallLabelStyle}>{label}</span>
  </span>
);

interface Props {
  ctx: PostCourseContext;
  /** Gross of the round attached to this post (C3). Enables the you-vs-them row. */
  theirGross?: number | null;
  onTap?: () => void;
}

export const PostCourseDataLine: React.FC<Props> = ({ ctx, theirGross, onTap }) => {
  const { t } = useTranslation('common');
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  const yourRounds = ctx.your_rounds ?? 0;
  const hasYourBest = yourRounds > 0 && ctx.your_best != null;
  const roundsTracked = ctx.rounds_tracked ?? 0;
  const hasRounds = roundsTracked > 0;

  // Cell inventory: a null figure omits its cell entirely (never a dash).
  const cells: { key: string; figure: string; label: string; color: string }[] = [];
  if (ctx.avg_over_par != null) {
    cells.push({
      key: 'avg',
      figure: `${ctx.avg_over_par > 0 ? '+' : ''}${ctx.avg_over_par.toFixed(1)}`,
      label: t('feed.courseLine.playsOnAvg'),
      color: RED,
    });
  }
  if (hasRounds) {
    cells.push({
      key: 'rounds',
      figure: String(roundsTracked),
      // count is passed as a NUMBER so i18next can pluralise (_one/_other).
      label: t('feed.courseLine.roundsTracked', { count: roundsTracked }),
      color: T100,
    });
  }
  if (hasYourBest) {
    cells.push({
      key: 'best',
      figure: String(ctx.your_best),
      label: t('feed.courseLine.yourBest'),
      color: AMBER,
    });
  }

  const cellCount = cells.length;

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || firedRef.current) return;
        firedRef.current = true;
        io.disconnect();
        analyticsEvents.track('feed_course_line_shown', {
          has_your_best: hasYourBest,
          has_rounds: hasRounds,
          cells: cellCount,
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasYourBest, hasRounds, cellCount]);

  // No tracked rounds at the course at all -> no panel. The course name and
  // region row above is untouched.
  const showPanel = hasRounds && cellCount > 0;
  if (!showPanel && theirGross == null) return null;

  return (
    <div ref={ref} style={{ marginTop: 8 }}>
      {showPanel && (
        <div
          role={onTap ? 'button' : undefined}
          tabIndex={onTap ? 0 : undefined}
          onClick={
            onTap
              ? (e) => {
                  e.stopPropagation();
                  analyticsEvents.track('feed_course_line_tapped', {
                    course_id: ctx.course_id,
                    has_your_best: hasYourBest,
                  });
                  onTap();
                }
              : undefined
          }
          style={{
            // Inset panel inside a full-bleed post. The parent row already
            // pads 14px, so -2px lands the panel at 12px from the screen edge.
            margin: '0 -2px 10px',
            background: PANEL_BG,
            border: `1px solid ${PANEL_LINE}`,
            borderRadius: 10,
            padding: '8px 0 9px',
            cursor: onTap ? 'pointer' : 'default',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 12px',
              marginBottom: 6,
            }}
          >
            <Flag size={9} color={AMBER} strokeWidth={2.5} />
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: AMBER,
                lineHeight: 1,
              }}
            >
              {t('feed.courseLine.panelHeading')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
            {cells.map((cell, i) => (
              <div
                key={cell.key}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'center',
                  padding: '0 6px',
                  borderLeft: i === 0 ? 'none' : `1px solid ${PANEL_LINE}`,
                }}
              >
                <div style={{ ...figureStyle, color: cell.color }}>{cell.figure}</div>
                <div style={labelStyle}>{cell.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C3 — you versus them, only when a round is attached to the post. */}
      {theirGross != null && (
        <span
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 2,
          }}
        >
          {hasYourBest && ctx.your_best != null ? (
            <>
              <Stat figure={String(theirGross)} label={t('feed.courseLine.them')} />
              <Stat figure={String(ctx.your_best)} label={t('feed.courseLine.you')} />
              <span
                style={{
                  ...smallFigureStyle,
                  fontSize: 11.5,
                  color: ctx.your_best < theirGross ? '#34D399' : ctx.your_best > theirGross ? RED : T60,
                }}
              >
                {ctx.your_best === theirGross
                  ? t('feed.courseLine.level')
                  : `${ctx.your_best < theirGross ? '-' : '+'}${Math.abs(ctx.your_best - theirGross)}`}
              </span>
            </>
          ) : (
            <span style={{ ...smallLabelStyle, color: T60, letterSpacing: '0.08em', textTransform: 'none', fontSize: 11 }}>
              {t('feed.courseLine.noBestToCompare')}
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default PostCourseDataLine;
