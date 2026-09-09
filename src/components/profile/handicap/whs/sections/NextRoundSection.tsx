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
 * CHART RULES (from the brief, do not relax):
 * - Five bars, one per round, oldest first. No target line, no shaded band.
 * - A bar that beats the target is green (CHART.DOWN); every other bar is the
 *   neutral track tone. The target is stated in words, not drawn.
 * - The zero rule renders ONLY when at least one differential is negative.
 * - Every bar carries its value beneath it.
 *
 * The old STAYS / DOWN TO scale bar above the table is gone; the table's own
 * figures say the same thing without a second geometry.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound, nextRoundScale } from '@/lib/whs/handicapMath';

import { HcpSection } from './HcpSection';
import { CHART, indexTone } from '../charts';

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

const BAR_H = 84;

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

  const shownPayload = useMemo(() => {
    if (!projection || !projection.hasData || currentHandicap == null) return null;
    const { cutTarget, settleAtRaw } = projection;
    if (!Number.isFinite(cutTarget) || !Number.isFinite(settleAtRaw)) return null;
    return {
      cut: Number(cutTarget.toFixed(1)),
      rise: Number((settleAtRaw - currentHandicap).toFixed(1)),
      counting: Math.min(8, total),
    };
  }, [projection, currentHandicap, total]);

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
        kicker={t('common:handicap.nextRound.eyebrow')}
        heading={t('common:handicap.nextRound.withheldHeading')}
      >
        <p style={{ margin: 0, fontSize: 12, color: CHART.DIM, lineHeight: 1.5, ...FIG }}>
          {t('common:handicap.nextRound.withheldBody', { count: total })}
        </p>
      </HcpSection>
    );
  }

  if (!projection || !projection.hasData) return null;

  const { cutTarget, settleAt, settleAtRaw } = projection;
  if (!Number.isFinite(cutTarget) || !Number.isFinite(settleAtRaw)) return null;

  const willRise = tone === 'up';
  const cut = cutTarget.toFixed(1);
  const settle = settleAt.toFixed(1);

  const line = willRise
    ? t('common:handicap.nextRound.lineRise', { settle })
    : t('common:handicap.nextRound.lineHold');
  const sub = willRise
    ? t('common:handicap.nextRound.subRise', { cut })
    : t('common:handicap.nextRound.subHold', { cut });

  const beating = last5.filter((v) => v < cutTarget).length;
  const bestOfFive = last5.length ? Math.min(...last5) : null;
  const rows = nextRoundScale(currentHandicap, cutTarget, bestOfFive);

  // Bar scale. The floor is zero unless a differential is negative, in which
  // case the scale opens downward and the zero rule appears.
  const minV = last5.length ? Math.min(...last5) : 0;
  const maxV = last5.length ? Math.max(...last5) : 1;
  const lo = Math.min(0, minV);
  const hi = Math.max(maxV, lo + 1);
  const span = hi - lo;
  const zeroPct = ((0 - lo) / span) * 100;
  const hasNegative = minV < 0;

  return (
    <HcpSection
      hairline
      kicker={t('common:handicap.nextRound.eyebrow')}
      heading={line}
      meta={t('common:handicap.nextRound.sample')}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          fontWeight: 400,
          color: CHART.MUTE,
          lineHeight: 1.45,
        }}
      >
        {sub}
      </p>

      {/* Five bars, oldest first. Green beats the target. */}
      {last5.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              position: 'relative',
              height: BAR_H,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            {hasNegative && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${zeroPct}%`,
                  height: 1,
                  background: CHART.BORDER,
                }}
              />
            )}
            {last5.map((v, i) => {
              const h = Math.max(3, ((v - lo) / span) * BAR_H);
              return (
                <span
                  key={i}
                  aria-hidden
                  style={{
                    flex: 1,
                    height: h,
                    borderRadius: 3,
                    background: v < cutTarget ? CHART.DOWN : CHART.TRACK,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {last5.map((v, i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: v < cutTarget ? CHART.DOWN : CHART.MUTE,
                  ...FIG,
                }}
              >
                {v.toFixed(1)}
              </span>
            ))}
          </div>
          <div style={{ ...KICKER, marginTop: 10 }}>
            {t('common:handicap.nextRound.beatLabel', {
              count: beating,
              total: last5.length,
              cut,
            })}
          </div>
        </div>
      )}

      {/* Shoot / Handicap. Break-even first, then the derived midpoint, then
          the best of five. */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={KICKER}>{t('common:handicap.nextRound.scaleShoot')}</span>
          <span style={KICKER}>{t('common:handicap.nextRound.scaleBecomes')}</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 10,
            }}
          >
            <span style={{ fontSize: 14.5, fontWeight: 600, color: CHART.INK, ...FIG }}>
              {t('common:handicap.nextRound.shootBeat', { value: r.shoot.toFixed(1) })}
              {r.isBest && (
                <span style={{ ...KICKER, marginLeft: 8 }}>
                  {t('common:handicap.nextRound.yourBest')}
                </span>
              )}
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: r.noChange ? CHART.MUTE : CHART.DOWN,
                  ...FIG,
                }}
              >
                {r.becomes.toFixed(1)}
              </span>
              {r.noChange && (
                <span style={KICKER}>{t('common:handicap.nextRound.noChange')}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </HcpSection>
  );
};

export default NextRoundSection;
