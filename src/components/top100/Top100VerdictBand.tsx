/**
 * Top100VerdictBand — the headline feature.
 *
 * Where golfers diverge from the published rank, a faintly tinted ONE-LINE
 * panel states the disagreement and nothing more: arrow, "Rated above/below its
 * rank", then the rating-order reference right-aligned in MUTE. No publication
 * is named, no judgement word is used, no formula is shown, and no figures are
 * repeated here - the rating and count sit in the row directly beneath.
 *
 * GREEN/RED STAY (BRIEF_COURSE_META_CONDENSE §4.4): a verdict with an arrow is
 * a MOVEMENT, not a score, so green-above / red-below follows the standing rule.
 * It was the heavy TINT that fought the block, not the hue.
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
import { type Verdict } from './verdict';
import { FIGS } from '@/lib/tokens/type';

/** A WHISPER of tint. The old solid fill + highlight + two shadows are gone. */
const GREEN_TINT = 'rgba(30,122,70,0.07)';
const GREEN_INK = '#0C7B40';
const RED_TINT = 'rgba(179,38,30,0.06)';
const RED_INK = '#B22F24';
/** The rank reference is a reference point, not a claim: it stays neutral. */
const MUTE_INK = '#68707B';

/** Fires once per course per session, not per mount. */
const seen = new Set<string>();
const seenRank = new Set<string>();

/** Minimum height of the ONE-LINE band. Nothing reserves it for layout. */
export const VERDICT_BAND_HEIGHT = 26;


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
        alignItems: 'center',
        gap: 7,
        width: '100%',
        minHeight: VERDICT_BAND_HEIGHT,
        padding: '7px 12px',
        borderRadius: 12,
        textAlign: 'left',
        /* A WHISPER of tint. No inset highlight, no box-shadows (§4.3). */
        background: higher ? GREEN_TINT : RED_TINT,
        border: 'none',
        boxShadow: 'none',
        color: ink,
      }}
    >
      <Trend size={14} strokeWidth={2.5} color={ink} aria-hidden style={{ flexShrink: 0 }} />

      <span
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
        }}
      >
        {t(higher ? 'top100.verdict.higher' : 'top100.verdict.lower')}
      </span>

      {ratingRank && (
        <span
          style={{
            ...FIGS,
            marginLeft: 'auto',
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: 'right',
            color: MUTE_INK,
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
