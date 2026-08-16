/**
 * Top100CourseStatsPanel — the COURSE STATS block beneath each rated Top 100
 * card.
 *
 * Renders NOTHING when the course carries no member rating: the "Rate" nudge
 * at the top of the tab already carries that ask, and ninety-odd identical
 * prompts drown the courses that actually hold data.
 *
 * Row one is ONE BASELINE: rating (band-coloured, with its sample size inline),
 * average to par, and the difficulty phrase right-aligned. The four rating
 * sub-scores that already live in course_rating_aggregates follow as ONE ROW OF
 * FOUR quarter-width columns, gated behind t100_subscore_min_ratings (default 3) so a
 * single member's afternoon is never presented as analysis.
 *
 * This component NEVER fetches course data — everything arrives batched from
 * useTop100Enrichment. Only the runtime threshold is read (cached config).
 *
 * Analytics callsites:
 *  - top100_subscores_shown  { course_id, rating_count }  (see barsRef IO)
 *  - top100_subscores_hidden { course_id, rating_count }  (see barsRef IO)
 *  - t100_no_rounds_line_shown { course_id, rank, list } (see noRoundsRef IO)
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import { SubScoreStack, bandColor } from '@/features/courses/_shared/scoreBands';
import { A, CAPTION, LABEL, NUM, toParParts } from '@/features/courses/components/holes/analytical/tokens';


/** Deliberately colourless: this is an invitation, not a data value. */
const NO_ROUNDS_INK = '#68707B';
/** Fires once per course per session, not per mount. */
const seenSubscores = new Set<string>();
const seenNoRounds = new Set<string>();
const seenDifficulty = new Set<string>();

interface Props {
  courseId: string;
  /**
   * Accepted for callsite compatibility but NO LONGER RENDERED: the short name
   * repeated the photo caption above it (BRIEF_COURSE_META_CONDENSE §1.1).
   */
  courseName?: string | null;
  rank: number | null;
  list: string;
  data: Top100Enrichment | undefined;
  /** Retained for callsite compatibility; the condensed row carries no CTA. */
  onRate?: () => void;
}

export const Top100CourseStatsPanel: React.FC<Props> = ({ courseId, rank, list, data }) => {

  const { t } = useTranslation('courses');
  const { subscoreMinRatings, bandLow, bandHigh } = useTop100Config();
  const barsRef = useRef<HTMLDivElement | null>(null);
  const difficultyRef = useRef<HTMLDivElement | null>(null);
  const noRoundsRef = useRef<HTMLDivElement | null>(null);

  const rating = data?.rating ?? null;
  const ratingCount = data?.ratingCount ?? 0;
  const avgOverPar = data?.avgOverPar ?? null;
  const harderPct = data?.harderThanPct ?? null;

  const hasRating = rating != null && ratingCount > 0;

  // Only when the block is already rendering AND nobody has logged a round.
  // At 1 or 2 rounds the existing "Early data" treatment already speaks.
  const showNoRounds = hasRating && (data?.roundsTracked ?? 0) === 0;

  const subs = data?.subScores;
  const showBars =
    hasRating &&
    ratingCount >= subscoreMinRatings &&
    !!subs &&
    subs.design != null &&
    subs.condition != null &&
    subs.facilities != null &&
    subs.clubhouse != null;

  // One-shot per course per session: did the 3-rating gate suppress the bars?
  useEffect(() => {
    const el = barsRef.current;
    if (!el || !hasRating || seenSubscores.has(courseId)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || seenSubscores.has(courseId)) return;
        seenSubscores.add(courseId);
        io.disconnect();
        analyticsEvents.track(
          showBars ? 'top100_subscores_shown' : 'top100_subscores_hidden',
          { course_id: courseId, rating_count: ratingCount },
        );
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [courseId, hasRating, showBars, ratingCount]);

  useEffect(() => {
    const el = noRoundsRef.current;
    if (!el || !showNoRounds || seenNoRounds.has(courseId)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || seenNoRounds.has(courseId)) return;
        seenNoRounds.add(courseId);
        io.disconnect();
        analyticsEvents.track('t100_no_rounds_line_shown', {
          course_id: courseId,
          rank,
          list,
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [courseId, showNoRounds, rank, list]);

  // One-shot per course per session: which difficulty band did we render?
  useEffect(() => {
    const el = difficultyRef.current;
    if (!el || seenDifficulty.has(courseId)) return;
    const pct = harderPct == null ? null : Math.round(harderPct);
    if (pct == null) return;
    const band = pct >= bandHigh ? 'hard' : pct <= bandLow ? 'easy' : 'middle';
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || seenDifficulty.has(courseId)) return;
        seenDifficulty.add(courseId);
        io.disconnect();
        analyticsEvents.track('t100_difficulty_band_shown', {
          course_id: courseId,
          band,
          pct,
          avg_over_par: avgOverPar,
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [courseId, harderPct, avgOverPar, bandLow, bandHigh, showNoRounds]);

  // Nothing to say about a course no member has rated.
  if (!hasRating) return null;

  /**
   * THE STAT ROW — ONE BASELINE (BRIEF_COURSE_META_CONDENSE §2).
   *
   * Rating (with its sample size inline), a hairline, average to par, and the
   * difficulty phrase right-aligned. Omission rules unchanged: the percentile
   * disappears at the middle band, avg-to-par disappears when toParParts
   * returns null, and the line rebalances with NO placeholder dashes.
   *
   * AVG TO PAR still rounds first then branches (toParParts), so a fractional
   * under-par average never renders "-0.0" and level reads "E".
   */
  const toPar = toParParts(avgOverPar);

  let difficulty: { label: string; pct: number } | null = null;
  if (harderPct != null) {
    const pct = Math.round(harderPct);
    const band: 'hard' | 'middle' | 'easy' =
      pct >= bandHigh ? 'hard' : pct <= bandLow ? 'easy' : 'middle';
    if (band !== 'middle') {
      difficulty = {
        label:
          band === 'hard'
            ? t('top100.stats.harderThanLabel')
            : t('top100.stats.easierThanLabel'),
        pct: band === 'hard' ? pct : 100 - pct,
      };
    }
  }

  const microLabel: React.CSSProperties = {
    ...LABEL,
    fontSize: 8,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ paddingTop: 4 }}>
      <div
        ref={difficultyRef}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          minWidth: 0,
        }}
      >
        {/* Rating — the figure carries its band colour and its sample size. */}
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, minWidth: 0 }}>
          <span style={{ ...NUM, fontSize: 22, lineHeight: 1, color: bandColor(rating) }}>
            {rating.toFixed(1)}
          </span>
          <span style={microLabel}>{t('top100.stats.fromRatings', { count: ratingCount })}</span>
        </span>

        {toPar && (
          <>
            <span
              aria-hidden
              style={{ width: 1, alignSelf: 'stretch', background: A.HAIRLINE, flexShrink: 0 }}
            />
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, minWidth: 0 }}>
              <span style={{ ...NUM, fontSize: 22, lineHeight: 1, color: toPar.tone }}>
                {toPar.text}
              </span>
              <span style={microLabel}>{t('top100.stats.avgToParLabel')}</span>
            </span>
          </>
        )}

        {difficulty && (
          <span
            style={{
              marginLeft: 'auto',
              ...CAPTION,
              textAlign: 'right',
              lineHeight: 1.25,
            }}
          >
            {difficulty.label}{' '}
            <span style={{ ...NUM, fontSize: 11.5, fontWeight: 700, color: A.INK }}>
              {difficulty.pct}%
            </span>{' '}
            {t('top100.stats.ofCourses')}
          </span>
        )}
      </div>

      {showNoRounds && (
        <div
          ref={noRoundsRef}
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: NO_ROUNDS_INK,
            lineHeight: 1.3,
            marginTop: 8,
          }}
        >
          {t('top100.stats.noRoundsTitle')} {t('top100.stats.noRoundsCta')}
        </div>
      )}

      {/*
        ONE ROW OF FOUR (§3). The observer div carries no height of its own, so a
        course below the ratings gate leaves NO reserved space here.
      */}
      <div ref={barsRef}>
        {showBars && subs && (
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <SubScoreStack label={t('top100.stats.design')} score={subs.design as number} />
            <SubScoreStack label={t('top100.stats.condition')} score={subs.condition as number} />
            <SubScoreStack label={t('top100.stats.facilities')} score={subs.facilities as number} />
            <SubScoreStack label={t('top100.stats.clubhouse')} score={subs.clubhouse as number} />
          </div>
        )}
      </div>
    </div>
  );
};


export default Top100CourseStatsPanel;
