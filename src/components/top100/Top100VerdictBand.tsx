/**
 * Top100VerdictBand — the headline feature.
 *
 * Where members diverge from the published rank, a coloured band states the
 * disagreement and nothing more. Permitted copy is exactly "Members rate it
 * higher/lower than its rank suggests", with the course named so the claim
 * cannot be misread against the next card. No publication is named, no judgement
 * word is used, no formula is shown, and no figures are repeated here - the
 * rating and count sit in the panel directly beneath.
 *
 * Suppression lives entirely in computeVerdict() — this component renders
 * whatever it is handed and renders nothing when handed null.
 *
 * Analytics callsites:
 *  - top100_verdict_shown  { course_id, direction, gap, rating_count } —
 *    once per course per session, first intersection only (same one-shot
 *    IntersectionObserver pattern used across feed panels).
 *  - top100_verdict_tapped { course_id, direction }
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { shortenCourseName, type Verdict } from './verdict';
import { FIGS } from '@/lib/tokens/type';

const GREEN_BG = '#EDF7F0';
const GREEN_INK = '#0C7B40';
const GREEN_LINE = 'rgba(15,143,74,0.14)';
const GREEN_SHADOW = 'rgba(15,143,74,0.07)';
const RED_BG = '#FDF1EF';
const RED_INK = '#B22F24';
const RED_LINE = 'rgba(200,55,43,0.13)';
const RED_SHADOW = 'rgba(200,55,43,0.07)';

/** Fires once per course per session, not per mount. */
const seen = new Set<string>();
const seenRank = new Set<string>();

/** Minimum height only. The band WRAPS and never truncates. */
export const VERDICT_BAND_HEIGHT = 30;

/** 1st / 2nd / 3rd / 4th ... */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export interface VerdictRatingRank {
  position: number;
  poolSize: number;
}

interface Props {
  courseId: string;
  courseName: string;
  verdict: Verdict;
  /** Standing within the rated pool of the selected list, when known. */
  ratingRank?: VerdictRatingRank | null;
  list?: string;
  /** Short label of the active list (Global, GB&I, USA, Europe). */
  listLabel?: string;
  onOpen: () => void;
}

export const Top100VerdictBand: React.FC<Props> = ({
  courseId,
  courseName,
  verdict,
  ratingRank,
  list,
  listLabel,
  onOpen,
}) => {
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

  // t100_rating_rank_shown — one shot per course per session, render callsite.
  useEffect(() => {
    const el = ref.current;
    if (!el || !ratingRank || seenRank.has(courseId)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || seenRank.has(courseId)) return;
        seenRank.add(courseId);
        io.disconnect();
        analyticsEvents.track('t100_rating_rank_shown', {
          course_id: courseId,
          list: list ?? null,
          position: ratingRank.position,
          pool_size: ratingRank.poolSize,
          published_rank: verdict.rank,
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [courseId, list, ratingRank, verdict.rank]);

  const ink = higher ? GREEN_INK : RED_INK;
  const line2Ink = higher ? '#63A883' : '#C87C72';
  const Trend = higher ? TrendingUp : TrendingDown;

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
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: '100%',
        minHeight: VERDICT_BAND_HEIGHT,
        padding: '11px 14px',
        borderRadius: 14,
        textAlign: 'left',
        background: higher ? GREEN_BG : RED_BG,
        border: 'none',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 0.5px ${higher ? GREEN_LINE : RED_LINE}, 0 1px 3px ${higher ? GREEN_SHADOW : RED_SHADOW}`,
        color: ink,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          lineHeight: 1.3,
        }}
      >
        {t(higher ? 'top100.verdict.higher' : 'top100.verdict.lower', {
          course: shortenCourseName(courseName),
        })}
        <Trend size={16} strokeWidth={2.5} color={ink} aria-hidden />
      </span>

      {ratingRank && (
        <span
          style={{
            ...FIGS,
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1.3,
            marginTop: 2,
            color: line2Ink,
          }}
        >
          {listLabel && listLabel.trim()
            ? t('top100.verdict.ratingRank', {
                position: ordinal(ratingRank.position),
                poolSize: ratingRank.poolSize,
                listLabel: listLabel.trim(),
              })
            : t('top100.verdict.ratingRankNoList', {
                position: ordinal(ratingRank.position),
                poolSize: ratingRank.poolSize,
              })}
        </span>
      )}
    </button>
  );
};


export default Top100VerdictBand;
