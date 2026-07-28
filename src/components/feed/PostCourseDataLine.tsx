/**
 * PostCourseDataLine — the data row under a Clubhouse post's course name.
 *
 * Values come from the batched `get_post_course_context` RPC (see
 * `usePostCourseContext`) — this component NEVER fetches. Figures are
 * monospace/tabular, labels are 9.5px uppercase, matching Discover.
 *
 * Analytics callsites:
 *  - feed_course_line_shown  { has_your_best } — once per post, on first
 *    intersection (never per scroll event).
 *  - feed_course_line_tapped { course_id, has_your_best } — on tap through.
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';

const T60 = 'rgba(248,250,252,0.65)';
const T40 = 'rgba(248,250,252,0.45)';
const T100 = '#F8FAFC';
const RED = '#EF4444';

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const figureStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12.5,
  fontWeight: 700,
  color: T100,
  lineHeight: 1,
};

const labelStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T40,
  lineHeight: 1,
};

const Stat: React.FC<{ figure: string; label: string; color?: string }> = ({
  figure,
  label,
  color,
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
    <span style={{ ...figureStyle, color: color ?? T100 }}>{figure}</span>
    <span style={labelStyle}>{label}</span>
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
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasYourBest]);

  const hasAvg = ctx.avg_over_par != null;
  const hasRounds = ctx.rounds_tracked != null && ctx.rounds_tracked > 0;
  if (!hasAvg && !hasRounds && yourRounds === 0) return null;

  const avgFigure =
    ctx.avg_over_par != null
      ? `${ctx.avg_over_par > 0 ? '+' : ''}${ctx.avg_over_par.toFixed(1)}`
      : null;

  return (
    <div
      ref={ref}
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
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: '6px 14px',
        marginTop: 8,
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      {avgFigure && (
        <Stat
          figure={avgFigure}
          label={t('feed.courseLine.avgOverPar')}
          color={RED}
        />
      )}
      {hasRounds && (
        <Stat
          figure={String(ctx.rounds_tracked)}
          label={t('feed.courseLine.roundsTracked')}
        />
      )}
      {hasYourBest ? (
        <Stat
          figure={String(ctx.your_best)}
          label={t('feed.courseLine.yourBest')}
        />
      ) : (
        <span style={{ ...labelStyle, color: T60, letterSpacing: '0.08em', textTransform: 'none', fontSize: 11 }}>
          {t('feed.courseLine.notPlayed')}
        </span>
      )}
    </div>
  );
};

export default PostCourseDataLine;
