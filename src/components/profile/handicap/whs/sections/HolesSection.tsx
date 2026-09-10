/**
 * HolesSection — SECTION G of the one-page handicap brief.
 *
 * The subject of this section is THE HOLE, not the round: what a member scores
 * on a hole (the outcome distribution, arriving here from SCORE STATS) and
 * which par types cost them (the three MiniRings, arriving from
 * GameEverywhereCard).
 *
 * NINE-HOLE ROUNDS ARE INCLUDED AND CARRY NO MARK. The unit here is the hole,
 * so nine holes contribute nine holes and every figure stays on one basis.
 * That is the OPPOSITE of Section F, where the unit was the round and nine-hole
 * rounds are excluded outright. If you are reading this because you found
 * `is_nine_hole` in a filter somewhere: it does not belong in this section.
 * (The par-type rings are the one exception, and not by choice — their RPC
 * excludes nine-hole rounds server-side and deployed RPCs are not edited.)
 *
 * COMPLETE CARDS ONLY: both sources count a hole only where `played IS TRUE`
 * and the gross is non-null, so a half-placeholder card contributes only its
 * real holes and never drags an average. Same rule as the round-post scorecard
 * strip.
 *
 * NO RING for the outcome distribution. The four-band ring is the same four
 * figures drawn twice — the reason the stableford ring came off Section F, and
 * moving rooms does not change it.
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScoringBreakdownAllCourses, useTrophyAggregates, type ParSplit } from '@/lib/whs/hooks';
import {
  SC_BIRDIE_DARK,
  SC_PAR_DARK,
  SC_BOGEY_DARK,
  SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';

import { HcpSection } from './HcpSection';
import { CHART, MiniRing, sharedMax, type ChartTone } from '../charts';

/** The distribution row needs this many holes before it says anything. */
const MIN_HOLES_DISTRIBUTION = 180;
/** A single ring needs this many holes OF ITS OWN TYPE. */
const MIN_HOLES_PAR_TYPE = 90;

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

interface Props {
  userId: string | undefined;
  connectionId: string | undefined;
  readOnly?: boolean;
}

type ParTypeKey = 'par3' | 'par4' | 'par5';
interface RingRow {
  key: ParTypeKey;
  parN: 3 | 4 | 5;
  data: ParSplit;
}

export const HolesSection: React.FC<Props> = ({ userId, connectionId, readOnly = false }) => {
  const { t } = useTranslation(['common']);

  // No dates: the window is all-time, which is what a hole-level figure wants.
  const { data: agg, isLoading: aggLoading } = useTrophyAggregates(
    readOnly ? undefined : userId,
    readOnly ? undefined : connectionId,
  );
  const { data: breakdown } = useScoringBreakdownAllCourses(!readOnly);

  const hs = (agg as any)?.hole_stats ?? null;
  const totalHoles: number = hs?.total_holes_in_window ?? 0;
  const rounds: number = hs?.rounds_with_holes_in_window ?? 0;
  const withheld = totalHoles < MIN_HOLES_DISTRIBUTION;

  const fired = useRef(false);
  useEffect(() => {
    if (aggLoading || fired.current) return;
    fired.current = true;
    if (withheld) {
      analyticsEvents.track('handicap_section_withheld', {
        section: 'holes',
        holes: totalHoles,
        required: MIN_HOLES_DISTRIBUTION,
      });
    } else {
      analyticsEvents.track('handicap_section_shown', {
        section: 'holes',
        holes: totalHoles,
        rounds,
      });
    }
  }, [aggLoading, withheld, totalHoles, rounds]);

  if (readOnly) return null;
  // Nothing renders while the hole payload is in flight — no skeleton, no jump.
  if (aggLoading) return null;

  if (withheld) {
    return (
      <HcpSection
        hairline
        kicker={t('common:handicap.holes.eyebrow')}
        heading={t('common:handicap.holes.heading')}
        meta={t('common:handicap.holes.meta', { count: rounds })}
      >
        <p style={{ margin: 0, fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
          {rounds > 0
            ? t('common:handicap.holes.withheldSome', { count: rounds })
            : t('common:handicap.holes.withheldNone')}
        </p>
      </HcpSection>
    );
  }

  /**
   * ── The four outcome bands, in the established palette ──────────────────
   *
   * DEFINITION, and why it is a subtraction rather than a sum.
   *
   * The four bands must partition total_holes_in_window exactly: every hole
   * with a card falls in one of them and in only one. Summing the RPC's
   * ace/albatross/eagle/birdie window counts does NOT partition it, because
   * those four counts overlap — an ace on a par 3 is both `gross = 1` and
   * `gross = par - 2`, and an ace on a par 4 is both `gross = 1` and
   * `gross = par - 3`, so every ace is counted twice. That is the whole of the
   * 4034-vs-4032 gap on the live record: two aces, counted twice each,
   * against a true 4032 holes. The RPC is correct and is not edited; it simply
   * answers "how many aces" and "how many eagles" separately, for the trophy
   * catalogue, and those answers were never meant to be added together.
   *
   * BIRDIE OR BETTER is therefore everything that is not a par, a bogey or a
   * double-plus. total_holes_in_window is the denominator and the arbiter, so
   * the four figures now always add to the basis line beneath them.
   */
  const birdiePlus = Math.max(
    0,
    totalHoles - (hs.pars_count ?? 0) - (hs.bogey_count ?? 0) - (hs.double_plus_count ?? 0),
  );

  const bands = [
    { key: 'birdiePlus', count: birdiePlus, label: t('common:handicap.holes.birdiePlus'), color: SC_BIRDIE_DARK },
    { key: 'par', count: hs.pars_count ?? 0, label: t('common:handicap.holes.par'), color: SC_PAR_DARK },
    { key: 'bogey', count: hs.bogey_count ?? 0, label: t('common:handicap.holes.bogey'), color: SC_BOGEY_DARK },
    { key: 'double', count: hs.double_plus_count ?? 0, label: t('common:handicap.holes.doublePlus'), color: SC_DOUBLE_DARK },
  ];

  // ── The three par-type rings ────────────────────────────────────────────
  const allTypes: Array<{ key: ParTypeKey; parN: 3 | 4 | 5; data: ParSplit | null }> = [
    { key: 'par3', parN: 3, data: breakdown?.par3 ?? null },
    { key: 'par4', parN: 4, data: breakdown?.par4 ?? null },
    { key: 'par5', parN: 5, data: breakdown?.par5 ?? null },
  ];
  const rings: RingRow[] = allTypes.filter(
    (r): r is RingRow => !!r.data && r.data.holes_played >= MIN_HOLES_PAR_TYPE,
  );
  const missing = allTypes.filter((r) => !rings.some((x) => x.key === r.key));

  /** ONE ceiling. Three rings on independent scales cannot be compared. */
  const ringMax = sharedMax(rings.map((r) => r.data.avg_over), 0.7);

  /**
   * Rank by value, never by par type. Worst RED, best GREEN, middle AMBER.
   * A stable sort keeps the earlier par type on the lower rank when two tie.
   */
  const ranked = [...rings].sort((a, b) => a.data.avg_over - b.data.avg_over);
  const toneFor = (row: RingRow): ChartTone => {
    if (ranked.length <= 1) return 'amber';
    if (row === ranked[ranked.length - 1]) return 'up';
    if (row === ranked[0]) return 'down';
    return 'amber';
  };

  const worst = ranked[ranked.length - 1];
  const best = ranked[0];
  const ringHoles = rings.reduce((s, r) => s + r.data.holes_played, 0);
  const share = worst && ringHoles > 0 ? Math.round((worst.data.holes_played / ringHoles) * 100) : 0;

  const ringSentence =
    worst && best && worst !== best
      ? t('common:handicap.holes.parSentence', {
          worst: worst.parN,
          worstAvg: worst.data.avg_over.toFixed(2),
          best: best.parN,
          bestAvg: best.data.avg_over.toFixed(2),
          share,
        })
      : null;

  const missingSentence =
    missing.length > 0
      ? t('common:handicap.holes.parMissing', {
          types: missing.map((m) => m.parN).join(', '),
          count: missing.length,
        })
      : null;

  return (
    <HcpSection
      hairline
      kicker={t('common:handicap.holes.eyebrow')}
      heading={t('common:handicap.holes.heading')}
      /* NO META. Two round populations live in this section — every hole with a
         card for the distribution, mapped eighteen-hole rounds for the rings —
         and one figure in the meta slot could only describe one of them. Each
         pool states its own basis beneath itself instead. */
    >
      {/* THE OUTCOME DISTRIBUTION — four counts, equal columns, no ring */}
      <div style={{ display: 'flex', gap: 12 }}>
        {bands.map((b) => {
          const pct = totalHoles > 0 ? Math.round((b.count / totalHoles) * 100) : 0;
          return (
            <div key={b.key} style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: b.count === 0 ? CHART.MUTE : b.color,
                  ...FIG,
                }}
              >
                {b.count}
              </div>
              <div style={{ ...KICKER, marginTop: 6 }}>{b.label}</div>
              <div style={{ marginTop: 3, fontSize: 11, fontWeight: 700, color: CHART.DIM, ...FIG }}>
                {pct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* BASIS for the four counts above. Percentages need their denominator. */}
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: CHART.DIM, ...FIG }}>
        {t('common:handicap.holes.basisHoles', { count: totalHoles })}
      </div>

      {/* Hairline across the content width */}
      <div aria-hidden style={{ height: 1, background: CHART.BORDER, margin: '18px 0' }} />

      {/* THE THREE PAR-TYPE RINGS — a missing type leaves its column empty */}
      <div style={{ display: 'flex', gap: 6 }}>
        {allTypes.map((row) => {
          const ring = rings.find((r) => r.key === row.key);
          return (
            <div key={row.key} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              {ring && (
                <MiniRing
                  value={ring.data.avg_over}
                  max={ringMax}
                  label={t('common:handicap.holes.parNs', { n: ring.parN })}
                  sub={t('common:handicap.holes.nHoles', { count: ring.data.holes_played })}
                  tone={toneFor(ring)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* BASIS for the rings: both restrictions are real and neither is visible
          from the hole counts alone. The RPC excludes nine-hole rounds and
          requires a mapped course; it is deployed, so this states it. */}
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: CHART.DIM, ...FIG }}>
        {t('common:handicap.holes.basisRings')}
      </div>

      {(ringSentence || missingSentence) && (
        <p style={{ margin: '14px 0 0', fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
          {[ringSentence, missingSentence].filter(Boolean).join(' ')}
        </p>
      )}
    </HcpSection>
  );
};

export default HolesSection;
