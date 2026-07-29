/**
 * Top100CourseStatsPanel — the COURSE STATS block beneath each rated Top 100
 * card.
 *
 * Renders NOTHING when the course carries no member rating: the "Rate" nudge
 * at the top of the tab already carries that ask, and ninety-odd identical
 * prompts drown the courses that actually hold data.
 *
 * Row one pairs the member rating (left) with the difficulty reading (right).
 * The four rating sub-scores that already live in course_rating_aggregates
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
import { useTranslation, Trans } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { AMBER, HAIRLINE_INK_8, INK } from '@/features/courses/_shared/tokens';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';

const RED = '#DC2626';
const GREEN = '#047857';
const LABEL_INK = 'rgba(15,23,42,0.42)';
const MUTED_INK = 'rgba(15,23,42,0.55)';
/** Deliberately colourless: this is an invitation, not a data value. */
const NO_ROUNDS_INK = '#68707B';
const TRACK = 'rgba(15,23,42,0.08)';
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/** Slashed zeros are switched off wherever tabular figures appear here. */
const NUMERALS: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

/** Fires once per course per session, not per mount. */
const seenSubscores = new Set<string>();
const seenNoRounds = new Set<string>();

const headingStyle: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: AMBER,
  lineHeight: 1,
};

const ratingStyle: React.CSSProperties = {
  ...NUMERALS,
  fontFamily: MONO,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.04em',
  lineHeight: 1.05,
  color: INK,
};

const difficultyLineStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 500,
  color: MUTED_INK,
  lineHeight: 1.35,
  letterSpacing: '-0.005em',
};

const barLabelStyle: React.CSSProperties = {
  width: 54,
  flexShrink: 0,
  fontSize: 10,
  fontWeight: 600,
  color: LABEL_INK,
  whiteSpace: 'nowrap',
  lineHeight: 1,
};

const barFigureStyle: React.CSSProperties = {
  ...NUMERALS,
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.02em',
};

function bandColor(score: number): string {
  if (score >= 9) return GREEN;
  if (score >= 7.5) return AMBER;
  return RED;
}

interface Props {
  courseId: string;
  rank: number | null;
  list: string;
  data: Top100Enrichment | undefined;
  onRate: () => void;
}

const SubScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
    <span style={barLabelStyle}>{label}</span>
    <div style={{ flex: 1, height: 3, borderRadius: 2, background: TRACK, minWidth: 0 }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, (score / 10) * 100))}%`,
          height: '100%',
          borderRadius: 2,
          background: bandColor(score),
        }}
      />
    </div>
    <span style={{ ...barFigureStyle, color: bandColor(score) }}>{score.toFixed(1)}</span>
  </div>
);

export const Top100CourseStatsPanel: React.FC<Props> = ({ courseId, rank, list, data, onRate }) => {
  const { t } = useTranslation('courses');
  const { subscoreMinRatings } = useTop100Config();
  const barsRef = useRef<HTMLDivElement | null>(null);
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

  // Nothing to say about a course no member has rated.
  if (!hasRating) return null;

  const figureStyleFor = (color: string): React.CSSProperties => ({
    ...NUMERALS,
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: 800,
    color,
    letterSpacing: '-0.02em',
  });

  /**
   * The difficulty reading, in three directions.
   *  above par  -> "Plays X above par on average" / "Harder than N% of courses"
   *  below par  -> "Plays X below par on average" / "Easier than (100-N)% of courses"
   *  level par  -> "Plays level par on average"   / "Middle of the pack for difficulty"
   * The percentile INVERTS below par: a course playing under par is not
   * "harder than 4%", it is easier than 96%.
   */
  const renderDifficulty = (): React.ReactNode => {
    if (avgOverPar == null) return null;

    if (avgOverPar === 0) {
      return (
        <>
          <div style={difficultyLineStyle}>{t('top100.stats.playsLevel')}</div>
          <div style={difficultyLineStyle}>{t('top100.stats.middleOfPack')}</div>
        </>
      );
    }

    const above = avgOverPar > 0;
    const color = above ? RED : GREEN;
    const abs = Math.abs(avgOverPar).toFixed(1);

    return (
      <>
        <div style={difficultyLineStyle}>
          <Trans
            i18nKey={above ? 'top100.stats.playsAbove' : 'top100.stats.playsBelow'}
            ns="courses"
            values={{ value: abs }}
            components={{ 1: <span style={figureStyleFor(color)} /> }}
          />
        </div>
        {harderPct != null && (
          <div style={difficultyLineStyle}>
            <Trans
              i18nKey={above ? 'top100.stats.harderThan' : 'top100.stats.easierThan'}
              ns="courses"
              values={{ pct: above ? Math.round(harderPct) : 100 - Math.round(harderPct) }}
              components={{ 1: <span style={figureStyleFor(color)} /> }}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ paddingTop: 10 }}>
      <div style={{ ...headingStyle, marginBottom: 8 }}>{t('top100.stats.heading')}</div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={ratingStyle}>{rating.toFixed(1)}</div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: MUTED_INK,
              lineHeight: 1.3,
              marginTop: 2,
            }}
          >
            {t('top100.stats.fromRatings', { count: ratingCount })}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          {showNoRounds ? (
            <div
              ref={noRoundsRef}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: NO_ROUNDS_INK,
                lineHeight: 1.3,
              }}
            >
              {t('top100.stats.noRounds')}
            </div>
          ) : (
            renderDifficulty()
          )}
        </div>
      </div>

      <div ref={barsRef}>
        {showBars && subs && (
          <div
            style={{
              marginTop: 9,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              borderTop: `1px solid ${HAIRLINE_INK_8}`,
              paddingTop: 9,
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
