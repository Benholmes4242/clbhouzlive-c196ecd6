/**
 * Top100CourseStatsPanel — the COURSE STATS block beneath each rated Top 100
 * card.
 *
 * Renders NOTHING when the course carries no member rating: the "Rate" nudge
 * at the top of the tab already carries that ask, and ninety-odd identical
 * prompts drown the courses that actually hold data.
 *
 * Row one is a centred three-up: rating (band-coloured), average to par and the
 * difficulty percentile. The four rating sub-scores that already live in course_rating_aggregates
 * follow as 2x2 bars, gated behind t100_subscore_min_ratings (default 3) so a
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
import { SubScoreBar, bandColor } from '@/features/courses/_shared/scoreBands';
import { A, KICKER, StatRow, toParParts, type StatItem } from '@/features/courses/components/holes/analytical/tokens';

/** Deliberately colourless: this is an invitation, not a data value. */
const NO_ROUNDS_INK = '#68707B';
/** Fires once per course per session, not per mount. */
const seenSubscores = new Set<string>();
const seenNoRounds = new Set<string>();
const seenDifficulty = new Set<string>();

const headingStyle: React.CSSProperties = {
  ...KICKER,
  lineHeight: 1,
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

interface Props {
  courseId: string;
  /** Names the card this block belongs to. Null → the quiet label renders alone. */
  courseName?: string | null;
  rank: number | null;
  list: string;
  data: Top100Enrichment | undefined;
  onRate: () => void;
}

export const Top100CourseStatsPanel: React.FC<Props> = ({ courseId, courseName, rank, list, data, onRate }) => {

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
   * The stat row.
   *
   * AVG TO PAR rounds FIRST, then branches, so a fractional under-par average
   * never renders "-0.0" and level reads "E".
   *
   * The percentile inverts below par - a course playing under par reads
   * EASIER THAN (100 - pct). At level par (the middle band) the cell is omitted
   * entirely: a midpoint percentile says nothing. Null cells are omitted and
   * the row rebalances. No placeholder dashes.
   */
  const buildItems = (): StatItem[] => {
    const items: StatItem[] = [
      {
        label: t('top100.stats.ratingLabel'),
        value: rating.toFixed(1),
        tone: bandColor(rating),
        sub: t('top100.stats.fromRatings', { count: ratingCount }),
      },
    ];

    const toPar = toParParts(avgOverPar);
    if (toPar) {
      items.push({
        label: t('top100.stats.avgToParLabel'),
        value: toPar.text,
        tone: toPar.tone,
      });
    }

    if (harderPct != null) {
      const pct = Math.round(harderPct);
      const band: 'hard' | 'middle' | 'easy' =
        pct >= bandHigh ? 'hard' : pct <= bandLow ? 'easy' : 'middle';
      if (band !== 'middle') {
        items.push({
          label:
            band === 'hard'
              ? t('top100.stats.harderThanLabel')
              : t('top100.stats.easierThanLabel'),
          value: `${band === 'hard' ? pct : 100 - pct}%`,
          tone: A.INK,
        });
      }
    }

    return items;
  };

  return (
    <div style={{ paddingTop: 10 }}>
      <div style={{ ...headingStyle, marginBottom: 10 }}>{t('top100.stats.heading')}</div>

      <div ref={difficultyRef}>
        <StatRow items={buildItems()} />
      </div>

      {showNoRounds && (
        <div
          ref={noRoundsRef}
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: NO_ROUNDS_INK,
            lineHeight: 1.3,
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          <div>{t('top100.stats.noRoundsTitle')}</div>
          <div>{t('top100.stats.noRoundsCta')}</div>
        </div>
      )}

      <div ref={barsRef}>
        {showBars && subs && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <SubScoreBar label={t('top100.stats.design')} score={subs.design as number} />
              <SubScoreBar label={t('top100.stats.condition')} score={subs.condition as number} />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <SubScoreBar label={t('top100.stats.facilities')} score={subs.facilities as number} />
              <SubScoreBar label={t('top100.stats.clubhouse')} score={subs.clubhouse as number} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Top100CourseStatsPanel;
