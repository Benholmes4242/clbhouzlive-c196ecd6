/**
 * NextRoundSection — SECTION C of the one-page handicap brief.
 *
 * Flat replacement for NextRoundWatch: no panel, no border, no radius. The
 * section carries the state sentence, its subline, a five-bar differential
 * chart of the last five rounds, and the Shoot / Handicap table.
 *
 * THE GATE IS 20 ROUNDS, NOT 8. projectNextRound divides by a FIXED 8 and
 * drops the oldest of a FULL 20, so below 20 rounds its cutTarget, settleAt
 * and at-risk state are computed on a denominator the member does not have.
 * Under 20 this section renders the withheld sentence instead of a target.
 * No corrected variable-denominator projection is attempted here — that is
 * new handicap maths and a separate decision.
 *
 * THE LADDER (approved mock B). Everything is stated as a GROSS SCORE at the
 * course played most in the last 20 — never as a differential. Rungs:
 * "{stays} or worse" (muted), the score to beat, a good day (the
 * nextRoundScale midpoint), and the member's real best at this course (dropped
 * when it doesn't beat the target). Scores use ceil-minus-one so the printed
 * target strictly beats cutTarget; Math.round could print a tie.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound, nextRoundScale, indexAfter } from '@/lib/whs/handicapMath';
import type { WhsScore } from '@/lib/whs/types';

import { HcpSection } from './HcpSection';
import { CHART, DEAD_BAND, indexTone } from '../charts';

/** A full rolling window. projectNextRound is only correct at this size. */
const MIN_ROUNDS = 20;

const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

interface Props {
  connectionId: string;
  currentHandicap: number | null;
}

interface Rung {
  label: string;
  sub: string;
  subGreen: boolean;
  index: number;
  kicker: string | null;
  moves: boolean;
}

interface Ladder {
  courseId: string;
  courseName: string;
  target: number;
  rungs: Rung[];
}

/**
 * Most-played course in the window (ties -> most recent round), using that
 * course's most recent round's ratings. Falls to the next course when the
 * ratings are missing; null when none has both.
 */
function pickCourse(window: WhsScore[]) {
  const order: string[] = [];
  const count = new Map<string, number>();
  for (const r of window) {
    if (!r.course_id) continue;
    if (!count.has(r.course_id)) order.push(r.course_id);
    count.set(r.course_id, (count.get(r.course_id) ?? 0) + 1);
  }
  // `order` is first appearance in a newest-first list = most recent; stable sort keeps it as tie-break.
  const ranked = [...order].sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0));
  for (const id of ranked) {
    const latest = window.find((r) => r.course_id === id)!;
    if (latest.course_rating != null && latest.slope_rating) {
      return { id, name: latest.course?.name ?? '', cr: latest.course_rating, slope: latest.slope_rating };
    }
  }
  return null;
}

function buildLadder(
  window: WhsScore[],
  current: number,
  cutTarget: number,
  last5: number[],
  t: TFunction,
): Ladder | null {
  const course = pickCourse(window);
  if (!course) return null;
  const { cr, slope } = course;
  // PCC is ignored here (it is almost always 0); not modelled.
  const diffOf = (gross: number) => ((gross - cr) * 113) / slope;
  // Largest whole score that strictly BEATS a differential. Never Math.round:
  // a rounded score can TIE the target and move nothing.
  const beats = (d: number) => {
    let s = Math.ceil((d * slope) / 113 + cr) - 1;
    while (diffOf(s) >= d) s -= 1; // float guard
    return s;
  };
  const target = beats(cutTarget);
  const stays = target + 1;

  const downRung = (score: number, sub: string): Rung | null => {
    const idx = indexAfter(current, cutTarget, diffOf(score));
    if (idx > current) return null;
    const delta = current - idx;
    return {
      label: String(score),
      sub,
      subGreen: false,
      index: idx,
      kicker: delta < DEAD_BAND ? null : t('common:handicap.nextRound.rungDown', { delta: delta.toFixed(1) }),
      moves: true,
    };
  };

  const rungs: Rung[] = [
    {
      label: t('common:handicap.nextRound.rungStaysScore', { score: stays }),
      sub: t('common:handicap.nextRound.rungStaysSub'),
      subGreen: false,
      index: current,
      kicker: t('common:handicap.nextRound.rungStaysKicker'),
      moves: false,
    },
  ];
  const tRung = downRung(target, t('common:handicap.nextRound.rungTargetSub'));
  if (tRung) rungs.push({ ...tRung, subGreen: true });

  const bestOfFive = last5.length ? Math.min(...last5) : null;
  const mid = nextRoundScale(current, cutTarget, bestOfFive)[1];
  const good = mid ? beats(mid.shoot) : null;

  const grossHere = window
    .filter((r) => r.course_id === course.id && typeof r.adjusted_gross === 'number')
    .map((r) => r.adjusted_gross as number);
  const bestHere = grossHere.length ? Math.min(...grossHere) : null;

  if (good != null && good < target && good !== bestHere) {
    const r = downRung(good, t('common:handicap.nextRound.rungGoodSub'));
    if (r) rungs.push(r);
  }
  // The member's real best AT THIS COURSE; dropped if it doesn't beat the target.
  if (bestHere != null && bestHere < target) {
    const r = downRung(bestHere, t('common:handicap.nextRound.rungBestSub'));
    if (r) rungs.push(r);
  }
  rungs.sort((a, b) => (a.moves === b.moves ? b.index - a.index : a.moves ? 1 : -1));

  return { courseId: course.id, courseName: course.name, target, rungs };
}

const NextRoundSection: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { t } = useTranslation(['common']);
  const { data: allScores, isLoading } = useAllScores(connectionId);

  const total = allScores?.length ?? 0;

  const projection = useMemo(() => {
    if (!allScores || allScores.length < MIN_ROUNDS || currentHandicap == null) return null;
    return projectNextRound(allScores.slice(0, 20), currentHandicap);
  }, [allScores, currentHandicap]);

  /** Last five differentials, OLDEST FIRST for the chart. */
  const last5 = useMemo(() => {
    if (!allScores) return [];
    return allScores
      .slice(0, 5)
      .map((r) => r.handicap_differential)
      .filter((d): d is number => typeof d === 'number' && !Number.isNaN(d))
      .reverse();
  }, [allScores]);

  const ladder = useMemo(
    () => (projection && projection.hasData && currentHandicap != null && allScores
      ? buildLadder(allScores.slice(0, 20), currentHandicap, projection.cutTarget, last5, t)
      : null),
    [projection, currentHandicap, allScores, last5, t],
  );

  const shownPayload = useMemo(() => {
    if (!projection || !projection.hasData || currentHandicap == null) return null;
    const { cutTarget, settleAtRaw } = projection;
    if (!Number.isFinite(cutTarget) || !Number.isFinite(settleAtRaw)) return null;
    return {
      cut: Number(cutTarget.toFixed(1)),
      rise: Number((settleAtRaw - currentHandicap).toFixed(1)),
      counting: Math.min(8, total),
      course_id: ladder?.courseId ?? null,
      target_score: ladder?.target ?? null,
      stays_score: ladder ? ladder.target + 1 : null,
    };
  }, [projection, currentHandicap, total, ladder]);

  const firedRef = useRef(false);
  useEffect(() => {
    if (!shownPayload || firedRef.current) return;
    firedRef.current = true;
    analyticsEvents.track('handicap_next_round_shown', shownPayload);
  }, [shownPayload]);

  // Withheld instrumentation (Section N): fires once when the sample falls
  // short of the full window.
  const withheld = !isLoading && currentHandicap != null && total < MIN_ROUNDS;
  const withheldFired = useRef(false);
  useEffect(() => {
    if (!withheld || withheldFired.current) return;
    withheldFired.current = true;
    analyticsEvents.track('handicap_section_withheld', {
      section: 'next_round',
      sample: total,
      required: MIN_ROUNDS,
    });
  }, [withheld, total]);

  const tone =
    projection && currentHandicap != null
      ? indexTone(currentHandicap, projection.settleAtRaw)
      : null;

  // Should be unreachable: a falling index means the stored value is stale.
  const impossibleRef = useRef(false);
  useEffect(() => {
    if (tone !== 'down' || impossibleRef.current || !projection || currentHandicap == null) return;
    impossibleRef.current = true;
    analyticsEvents.track('handicap_next_round_impossible_state', {
      settle: projection.settleAt,
      cut: projection.cutTarget,
      current: currentHandicap,
    });
  }, [tone, projection, currentHandicap]);

  if (isLoading || currentHandicap == null) return null;

  // ── Withheld: fewer than a full window of rounds ───────────────────────
  if (withheld) {
    return (
      <HcpSection
        hairline
        heading={t('common:handicap.nextRound.withheldHeading')}
      >
        <p style={{ margin: 0, fontSize: 12, color: CHART.DIM, lineHeight: 1.5, ...FIG }}>
          {t('common:handicap.nextRound.withheldBody', { count: total })}
        </p>
      </HcpSection>
    );
  }

  if (!projection || !projection.hasData) return null;

  const { cutTarget, settleAtRaw } = projection;
  if (!Number.isFinite(cutTarget) || !Number.isFinite(settleAtRaw)) return null;

  const beating = last5.filter((v) => v < cutTarget).length;

  const willRise = tone === 'up';
  const rungs = ladder?.rungs ?? [];

  return (
    <HcpSection
      hairline
      kicker={t('common:handicap.nextRound.eyebrow')}
      heading={t('common:handicap.nextRound.ladderHeading')}
    >
      {ladder == null ? (
        // No course among the last 20 carries both ratings: withhold rather
        // than print a target in differentials.
        <p style={{ margin: 0, fontSize: 12, color: CHART.DIM, lineHeight: 1.5, ...FIG }}>
          {t('common:handicap.nextRound.withheldBody', { count: total })}
        </p>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 13.5, color: CHART.MUTE, lineHeight: 1.45 }}>
            {t('common:handicap.nextRound.courseLine', { course: ladder.courseName })}
          </p>

          <div style={{ marginTop: 20, display: 'flex' }}>
            {/* 3px rail: muted beside the "stays" rung, green from where it moves. */}
            <div aria-hidden style={{ width: 3, display: 'flex', flexDirection: 'column', marginRight: 14 }}>
              {rungs.map((r, i) => (
                <span
                  key={i}
                  style={{ flex: 1, background: r.moves ? CHART.DOWN : CHART.TRACK }}
                />
              ))}
            </div>
            <div style={{ flex: 1 }}>
              {rungs.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${CHART.BORDER}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: r.moves ? CHART.INK : CHART.MUTE, ...FIG }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, color: r.subGreen ? CHART.DOWN : CHART.MUTE }}>
                      {r.sub}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: r.moves ? CHART.DOWN : CHART.MUTE, ...FIG }}>
                      {r.index.toFixed(1)}
                    </div>
                    {r.kicker && <div style={{ ...KICKER, marginTop: 2 }}>{r.kicker}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ margin: '16px 0 0', fontSize: 13.5, color: CHART.MUTE, lineHeight: 1.45, ...FIG }}>
            {beating > 0 ? (
              <Trans
                i18nKey="common:handicap.nextRound.formLine"
                values={{ score: ladder.target, count: beating }}
                components={{ g: <span style={{ color: CHART.DOWN, fontWeight: 700 }} /> }}
              />
            ) : (
              t('common:handicap.nextRound.formLineNone')
            )}
          </p>
        </>
      )}

      <p style={{ margin: '10px 0 0', fontSize: 11.5, color: CHART.MUTE, lineHeight: 1.45 }}>
        {/* The "cannot go up" clause is only true when the projection holds;
            if the index is set to rise, print provenance alone. */}
        {willRise
          ? t('common:handicap.nextRound.sampleSentence')
          : t('common:handicap.nextRound.provenance')}
      </p>
    </HcpSection>
  );
};

export default NextRoundSection;
