/**
 * HolesSection — PHASE 5 "WHERE THE STROKES GO" of BRIEF_HANDICAP_TAB_REBUILD.
 *
 * EVERY FIGURE comes from get_my_scoring_breakdown_all_courses via
 * deriveStrokesGo — none from get_trophy_aggregates (§5.3: the old caption
 * took its hole count from the trophy aggregates, which INCLUDE nine-hole
 * rounds, while the share percentage summed ParSplit holes, which EXCLUDE
 * them server-side — two populations, arithmetic that did not close).
 *
 * THE BASIS RULE (§5.2) lives in src/lib/whs/strokesGo.ts: holes a round is
 * the mix ratio × 18, NEVER holes_played / complete_rounds.
 *
 * §5.7: there is deliberately NO "lever" card (holding par 4s to a par-3
 * standard is an arithmetic identity presented as advice). §5.6's observation
 * line replaces it. §5.8: OWN-PROFILE ONLY — the RPC resolves auth.uid()
 * server-side, so on another member's profile nothing renders. §5.9: the RPC
 * inner-joins the course map, so unmapped rounds are absent; the hole count
 * is NOT reconciled with any round count elsewhere on the profile.
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores, useScoringBreakdownAllCourses } from '@/lib/whs/hooks';
import { counterWindow } from '@/lib/whs/counting';
import { deriveStrokesGo, shotsToDifferential } from '@/lib/whs/strokesGo';
import {
  SC_BIRDIE_DARK,
  SC_PAR_DARK,
  SC_BOGEY_DARK,
  SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { HcpSection } from './HcpSection';
import { CHART } from '../charts';
import { pickCourse } from '@/lib/whs/pickCourse';

/** The section needs this many holes before it says anything. */
const MIN_HOLES = 180;

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

interface Props {
  userId: string | undefined;
  connectionId: string | undefined;
  readOnly?: boolean;
}

export const HolesSection: React.FC<Props> = ({ userId, connectionId, readOnly = false }) => {
  const { t } = useTranslation(['common']);

  // §5.8: the one read, owner-only by construction.
  const { data: breakdown, isLoading } = useScoringBreakdownAllCourses(!readOnly);
  // §5.6: the member's most-played course in the window, for the differential.
  const { data: scores } = useAllScores(readOnly ? undefined : connectionId);

  const s = breakdown ? deriveStrokesGo({ par3: breakdown.par3, par4: breakdown.par4, par5: breakdown.par5 }) : null;
  const withheld = !s || s.totalHoles < MIN_HOLES;

  const fired = useRef(false);
  useEffect(() => {
    if (isLoading || fired.current) return;
    fired.current = true;
    analyticsEvents.track(withheld ? 'handicap_section_withheld' : 'handicap_section_shown', {
      section: 'holes',
      holes: s?.totalHoles ?? 0,
      required: MIN_HOLES,
    });
  }, [isLoading, withheld, s]);

  if (readOnly) return null;
  // Nothing renders while the payload is in flight — no skeleton, no jump.
  if (isLoading) return null;

  if (withheld) {
    return (
      <HcpSection hairline kicker={t('common:handicap.strokes.kicker')} heading={t('common:handicap.strokes.titleFallback')}>
        <p style={{ margin: 0, fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
          {t('common:handicap.strokes.withheld')}
        </p>
      </HcpSection>
    );
  }

  const d = s!;

  /* §5.1: the title names whichever par type carries the largest share of
     shots dropped. 5A H2: a type below MIN_HOLES_PAR_TYPE cannot win, and if
     NO type clears the threshold the plain section name renders instead and
     the derived sentence does not. */
  const dom = d.dominant;
  const totalShots = d.rows.reduce((x, r) => x + (r.shotsPerRound ?? 0), 0);
  const holesShare = dom ? Math.round((dom.holesPlayed / d.totalHoles) * 100) : 0;
  const shotsShare = dom && totalShots > 0 ? Math.round((dom.shotsPerRound! / totalShots) * 100) : 0;

  /* §5.4: tone by severity — worst RED, middle AMBER, best the improved tone.
     Rank by shots a round, never by par type; stable sort keeps the earlier
     par type on the lower rank when two tie. 5A H1: withheld rows carry no
     figure, so they are not ranked and take no tone. */
  const ranked = d.rows
    .filter((r): r is (typeof d.rows)[number] & { shotsPerRound: number } => r.shotsPerRound !== null)
    .sort((a, b) => a.shotsPerRound - b.shotsPerRound);
  const toneFor = (row: (typeof d.rows)[number]) => {
    if (row.shotsPerRound === null) return null;
    if (ranked.length <= 1) return CHART.AMBER;
    if (row === ranked[ranked.length - 1]) return CHART.UP;
    if (row === ranked[0]) return CHART.DOWN;
    return CHART.AMBER;
  };
  const worstShots = ranked[ranked.length - 1]?.shotsPerRound ?? 0;

  /* 5B L3: when the RPC predates the four count fields, bands is null and
     neither the bar nor the band labels render — absent, not approximated.
     L4: labels and tones unchanged. */
  const bands = d.bands
    ? [
        { key: 'birdiePlus', pct: d.bands.birdiePlus, label: t('common:handicap.holes.birdiePlus'), color: SC_BIRDIE_DARK },
        { key: 'par', pct: d.bands.par, label: t('common:handicap.holes.par'), color: SC_PAR_DARK },
        { key: 'bogey', pct: d.bands.bogey, label: t('common:handicap.holes.bogey'), color: SC_BOGEY_DARK },
        { key: 'double', pct: d.bands.doublePlus, label: t('common:handicap.holes.doublePlus'), color: SC_DOUBLE_DARK },
      ]
    : null;

  /* §5.6: one fewer double a round is one shot of gross, which is 113/slope
     of a differential at the member's most-played course. */
  const course = scores ? pickCourse(counterWindow(scores)) : null;
  const diffPerShot = course ? shotsToDifferential(1, course.slope) : null;

  return (
    <HcpSection
      hairline
      kicker={t('common:handicap.strokes.kicker')}
      heading={
        dom
          ? t('common:handicap.strokes.title', { n: dom.parN, holesShare, shotsShare })
          : t('common:handicap.strokes.titleFallback')
      }
    >
      {/* §5.1 caption: N is the SUM of holes_played across the three types. */}
      <p style={{ margin: '0 0 16px', fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: CHART.MUTE, ...FIG }}>
        {t('common:handicap.strokes.caption', { holes: d.totalHoles.toLocaleString('en-GB') })}
      </p>

      {/* §5.4: the three par rows. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {d.rows.map((row) => {
          const tone = toneFor(row);
          const fill =
            row.shotsPerRound !== null && worstShots > 0
              ? Math.max(0, Math.min(1, row.shotsPerRound / worstShots))
              : 0;
          return (
            <div key={row.parN}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: CHART.INK }}>
                  {t('common:handicap.holes.parNs', { n: row.parN })}
                </span>
                {/* 5A H1: a below-threshold type states NO figure. */}
                {row.shotsPerRound !== null && (
                  <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: tone ?? undefined, ...FIG }}>
                    {row.shotsPerRound.toFixed(1)}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 6, height: 4, borderRadius: 999, background: CHART.BORDER, overflow: 'hidden' }}>
                {row.shotsPerRound !== null && (
                  <div style={{ width: `${fill * 100}%`, height: '100%', background: tone ?? undefined, borderRadius: 999 }} />
                )}
              </div>
              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 400, color: CHART.DIM, ...FIG }}>
                {row.shotsPerRound !== null
                  ? t('common:handicap.strokes.rowMeta', {
                      holes: row.holesPerRound.toFixed(1),
                      perHole: `+${row.perHole.toFixed(2)}`,
                      played: row.holesPlayed.toLocaleString('en-GB'),
                    })
                  : t('common:handicap.strokes.rowMetaWithheld', {
                      holes: row.holesPerRound.toFixed(1),
                      played: row.holesPlayed.toLocaleString('en-GB'),
                    })}
              </div>
            </div>
          );
        })}
      </div>

      {/* §5.5: the outcome distribution, one segmented 7px bar. */}
      <div
        aria-hidden
        style={{ display: 'flex', height: 7, borderRadius: 999, overflow: 'hidden', background: CHART.TRACK, marginTop: 22 }}
      >
        {bands.map((b) =>
          b.pct > 0 ? (
            <div key={b.key} style={{ width: `${b.pct}%`, background: b.color }} />
          ) : null,
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {bands.map((b) => (
          <div key={b.key} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, color: b.pct === 0 ? CHART.MUTE : b.color, ...FIG }}>
              {Math.round(b.pct)}%
            </div>
            <div
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: CHART.DIM, marginTop: 5,
              }}
            >
              {b.label}
            </div>
          </div>
        ))}
      </div>

      {/* §5.6: the one observation line. */}
      <p
        style={{
          margin: '18px 0 0',
          borderLeft: `2px solid ${CHART.AMBER}`,
          paddingLeft: 11,
          fontSize: 12.5,
          fontWeight: 400,
          lineHeight: 1.45,
          color: A.BODY,
          ...FIG,
        }}
      >
        {diffPerShot != null
          ? t('common:handicap.strokes.observation', {
              doubles: d.doublesPerRound.toFixed(1),
              diff: diffPerShot.toFixed(1),
              course: course!.name,
            })
          : t('common:handicap.strokes.observationNoCourse', {
              doubles: d.doublesPerRound.toFixed(1),
            })}
      </p>
    </HcpSection>
  );
};

export default HolesSection;
