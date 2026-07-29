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

const T100 = '#F8FAFC';
const T60 = 'rgba(248,250,252,0.62)';
const T40 = 'rgba(248,250,252,0.42)';
const RED = '#EF4444';
const AMBER = '#F7931E';
const LINE = 'rgba(255,255,255,0.10)';
const SURFACE = 'rgba(255,255,255,0.035)';

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const inlineFigureValueStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1,
};

const inlineFigureLabelStyle: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: T40,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

export interface CourseBandFigure {
  key: string;
  figure: string;
  label: string;
  color: string;
}

interface Props {
  courseName: string | null | undefined;
  courseLocation?: string | null;
  courseRating?: number | null;
  ctx?: PostCourseContext | null;
  /** Opens the course stats sheet. Not wired when there are no figures. */
  onOpenStats?: () => void;
  /** The existing actions row, attached to the same container. */
  actions: React.ReactNode;
  /** Extra content (C3 you-vs-them row) rendered under row one. */
  extra?: React.ReactNode;
}

export const PostCourseBand: React.FC<Props> = ({
  courseName,
  courseLocation,
  courseRating,
  ctx,
  onOpenStats,
  actions,
  extra,
}) => {
  const { t } = useTranslation('common');

  const roundsTracked = ctx?.rounds_tracked ?? 0;
  const hasRounds = roundsTracked > 0;
  const hasYourBest = (ctx?.your_rounds ?? 0) > 0 && ctx?.your_best != null;

  // Figure inventory. A null figure omits its cell entirely, never a dash.
  // No tracked rounds at all -> NO figures, and the row is not tappable.
  const figures: CourseBandFigure[] = [];
  if (hasRounds) {
    if (ctx?.avg_over_par != null) {
      figures.push({
        key: 'avg',
        figure: `${ctx.avg_over_par > 0 ? '+' : ''}${ctx.avg_over_par.toFixed(1)}`,
        label: t('feed.courseBand.avg'),
        color: RED,
      });
    }
    figures.push({
      key: 'rounds',
      figure: String(roundsTracked),
      // count is passed as a NUMBER so i18next can pluralise (_one/_other).
      label: t('feed.courseBand.rounds', { count: roundsTracked }),
      color: T100,
    });
    if (hasYourBest) {
      figures.push({
        key: 'best',
        figure: String(ctx?.your_best),
        label: t('feed.courseBand.yourBest'),
        color: AMBER,
      });
    }
  }

  const tappable = figures.length > 0 && !!onOpenStats;

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tappable) return;
    analyticsEvents.track('course_band_tapped', {
      course_id: ctx?.course_id ?? null,
      has_your_best: hasYourBest,
      figures: figures.length,
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
          fontWeight: 800,
          letterSpacing: '-0.015em',
          lineHeight: 1.05,
          color: T100,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {courseName}
      </div>
      {courseRating != null ? (
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
              fontWeight: 800,
              color: T60,
              lineHeight: 1,
            }}
          >
            {formatRatingValue(courseRating)}
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
              fontSize: 11.5,
              lineHeight: 1,
              color: T60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {courseLocation}
          </span>
        ) : null}
      </div>


      <div style={{ flex: 1, minWidth: 0 }} />

      {figures.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            flexShrink: 0,
          }}
        >
          {figures.map((f) => (
            <div
              key={f.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ ...inlineFigureValueStyle, color: f.color }}>
                {f.figure}
              </span>
              <span style={inlineFigureLabelStyle}>{f.label}</span>
            </div>
          ))}
        </div>
      )}

      {tappable && (
        <ChevronRight
          size={14}
          color={T40}
          style={{ flexShrink: 0, marginLeft: 6 }}
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

  return (
    <div style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
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

      <div style={{ borderTop: `1px solid ${LINE}` }}>{actions}</div>
    </div>
  );
};

export default PostCourseBand;
