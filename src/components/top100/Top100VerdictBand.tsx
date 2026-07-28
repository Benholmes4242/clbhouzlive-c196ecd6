/**
 * Top100VerdictBand — the headline feature.
 *
 * Where members diverge from the published rank, a coloured band states the
 * disagreement and nothing more. Permitted copy is exactly "Members rate it
 * higher" / "Members rate it lower" with the two raw figures beside it. No
 * publication is named, no judgement word is used, and no formula is shown.
 *
 * Suppression lives entirely in computeVerdict() — this component renders
 * whatever it is handed and renders nothing when handed null.
 *
 * Analytics callsites:
 *  - top100_verdict_shown  { course_id, direction, gap, rating_count } —
 *    once per course per session, first intersection only (same one-shot
 *    IntersectionObserver pattern as PostCourseDataLine).
 *  - top100_verdict_tapped { course_id, direction }
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { Verdict } from './verdict';

const GREEN_BG = 'rgba(16,185,129,0.10)';
const GREEN_LINE = 'rgba(16,185,129,0.28)';
const GREEN_INK = '#047857';
const RED_BG = 'rgba(239,68,68,0.09)';
const RED_LINE = 'rgba(239,68,68,0.26)';
const RED_INK = '#B91C1C';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/** Fires once per course per session, not per mount. */
const seen = new Set<string>();

export const VERDICT_BAND_HEIGHT = 30;

interface Props {
  courseId: string;
  verdict: Verdict;
  onOpen: () => void;
}

export const Top100VerdictBand: React.FC<Props> = ({ courseId, verdict, onOpen }) => {
  const { t } = useTranslation('courses');
  const ref = useRef<HTMLButtonElement | null>(null);

  const higher = verdict.direction === 'higher';

  useEffect(() => {
    const el = ref.current;
    if (!el || seen.has(courseId)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || seen.has(courseId)) return;
        seen.add(courseId);
        io.disconnect();
        analyticsEvents.track('top100_verdict_shown', {
          course_id: courseId,
          direction: verdict.direction,
          gap: verdict.gap,
          rating_count: verdict.ratingCount,
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [courseId, verdict.direction, verdict.gap, verdict.ratingCount]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        analyticsEvents.track('top100_verdict_tapped', {
          course_id: courseId,
          direction: verdict.direction,
        });
        onOpen();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
        height: VERDICT_BAND_HEIGHT,
        padding: '0 12px',
        borderRadius: 8,
        textAlign: 'left',
        background: higher ? GREEN_BG : RED_BG,
        border: `1px solid ${higher ? GREEN_LINE : RED_LINE}`,
        color: higher ? GREEN_INK : RED_INK,
      }}
    >
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: '-0.005em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {higher ? t('top100.verdict.higher') : t('top100.verdict.lower')}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontVariantNumeric: 'tabular-nums',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          opacity: 0.85,
          whiteSpace: 'nowrap',
        }}
      >
        {t('top100.verdict.figures', {
          rank: verdict.rank,
          rating: verdict.rating.toFixed(1),
        })}
      </span>
    </button>
  );
};

export default Top100VerdictBand;
