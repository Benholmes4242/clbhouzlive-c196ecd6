import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INK, MUTE, DIM, BORDER, TRACK, GOOD, BAD, LABEL, CAPTION, NUM } from './designTokens';
import { PrimaryButton, FooterBar, FlowBody, FlowHead, Panel, PanelGap } from './Primitives';
import { useImportedCounts } from './useImportedCounts';
import {
  useHandicapHistory,
  useScoringBreakdownAllCourses,
  useNemesisHoles,
} from '@/lib/whs/hooks';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ParRings from './ParRings';

interface Props {
  firstName: string;
  handicapIndex: number | null;
  homeClub: string | null;
  /** Legacy server figures - retained for API compatibility, not displayed. */
  scoresImported?: number;
  friendsImported?: number;
  connectionId?: string | null;
  onContinue: () => void;
}

const YEAR = 365 * 86400_000;

/**
 * Ceiling on the pending state. useImportedCounts polls forever, so the screen
 * owns the end of waiting: after this the counters settle to the em dash (the
 * honest "we cannot read a figure" state) rather than shimmering indefinitely.
 */
const PENDING_CEILING_MS = 45_000;

/**
 * THE FLOOR. Derived from the connected population, not invented: the smallest
 * record in the base today is 29 complete 18-hole rounds, and the RPC's par
 * splits only steady once each par type has a few dozen holes behind it. Eight
 * complete rounds is ~144 holes (~32 par 3s) - the point at which avg_over per
 * par type stops moving with a single bad hole. Every real newly connected
 * member clears it on import; a thin record does not get rings built on noise.
 */
const RINGS_MIN_COMPLETE_ROUNDS = 8;
/** A par split also needs its own holes behind it, not just the round count. */
const RINGS_MIN_HOLES_PER_PAR = 20;

const MINUS = '\u2212';
const DASH = '\u2014';

const fmtIndex = (h: number | null) => {
  if (h === null || h === undefined) return DASH;
  return h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1);
};

/** SCREEN 5 - THE PAYOFF. Index, then where the shots go, then what costs most. */
export const WelcomeAboardScreen: React.FC<Props> = ({
  handicapIndex,
  connectionId,
  onContinue,
}) => {
  const { t } = useTranslation('handicap');
  const { user } = useSupabaseSession();
  const { data: counts, isFetching: countsFetching } = useImportedCounts(connectionId);
  const { data: history, isFetching: historyFetching } = useHandicapHistory(
    connectionId ?? undefined,
    'all',
  );
  /* Both READ-ONLY, and this screen only ever mounts on stage 'done'. */
  const { data: breakdown } = useScoringBreakdownAllCourses(true);
  const { data: nemesis } = useNemesisHoles(user?.id, 3, true);

  const [ceilingHit, setCeilingHit] = useState(false);
  useEffect(() => {
    if (counts) return;
    const timer = setTimeout(() => setCeilingHit(true), PENDING_CEILING_MS);
    return () => clearTimeout(timer);
  }, [counts]);

  /* UNRESOLVED IS NOT ABSENT: pending while the source has not settled - the
     connection id is not known yet, or the counts query is still polling. */
  const countersPending =
    !ceilingHit && !counts && (!connectionId || countsFetching || historyFetching || !history);

  const { delta, years, sinceYear } = useMemo(() => {
    const pts = (history ?? []).filter((p) => Number.isFinite(p.handicap_index));
    if (pts.length === 0) {
      return { delta: null as number | null, years: null as number | null, sinceYear: null as number | null };
    }

    const first = new Date(pts[0].observed_at).getTime();
    const last = new Date(pts[pts.length - 1].observed_at).getTime();
    const spanYears = Math.max(1, Math.round((last - first) / YEAR));

    // Delta only exists with a full 12 months behind the member.
    const cutoff = Date.now() - YEAR;
    const hasYear = first <= cutoff;
    const oldest = pts.find((p) => new Date(p.observed_at).getTime() >= cutoff) ?? pts[0];
    const current = handicapIndex ?? pts[pts.length - 1].handicap_index;
    const d = hasYear ? Number((current - oldest.handicap_index).toFixed(1)) : null;

    return { delta: d, years: spanYears, sinceYear: new Date(first).getFullYear() };
  }, [history, handicapIndex]);

  const improved = delta !== null && delta < 0;
  const deltaColor = delta === null ? MUTE : improved ? GOOD : BAD;

  /* The copy must not assert completion the member cannot see. While the
     figures are still landing the headline states what is happening. */
  const headline = countersPending
    ? t('whsConnect.done.headlinePending')
    : years && years > 1
    ? t('whsConnect.done.headlineYears', { years })
    : t('whsConnect.done.headline');

  const sub = countersPending
    ? t('whsConnect.done.subPending')
    : t('whsConnect.done.sub');

  const par3 = breakdown?.par3 ?? null;
  const par4 = breakdown?.par4 ?? null;
  const par5 = breakdown?.par5 ?? null;

  const ringsReady =
    !!breakdown &&
    (breakdown.complete_rounds ?? 0) >= RINGS_MIN_COMPLETE_ROUNDS &&
    !!par3 && !!par4 && !!par5 &&
    par3.holes_played >= RINGS_MIN_HOLES_PER_PAR &&
    par4.holes_played >= RINGS_MIN_HOLES_PER_PAR &&
    par5.holes_played >= RINGS_MIN_HOLES_PER_PAR;

  const holes = (nemesis ?? []).filter((h) => Number.isFinite(h.my_avg_over));
  const holesReady = ringsReady && holes.length >= 3;
  const maxCost = holes.length ? Math.max(...holes.map((h) => Math.abs(h.my_avg_over))) : 0;

  const belowFloor = !ringsReady && !!breakdown;

  return (
    <>
      <FlowBody>
        <FlowHead kicker={t('whsConnect.done.kicker')} kickerColor={GOOD} headline={headline} sub={sub} />

        <div style={{ marginTop: 22 }}>
          {/* a. HANDICAP INDEX */}
          <Panel
            kicker={t('whsConnect.done.indexLabel')}
            aside={
              counts?.courses && sinceYear
                ? t('whsConnect.done.coursesSince', { courses: counts.courses, year: sinceYear })
                : undefined
            }
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: INK,
                  ...NUM,
                }}
              >
                {countersPending && handicapIndex === null ? DASH : fmtIndex(handicapIndex)}
              </div>
              {delta !== null ? (
                <div style={{ paddingBottom: 3 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: deltaColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      ...NUM,
                    }}
                  >
                    <span aria-hidden>{improved ? '\u25BC' : '\u25B2'}</span>
                    {`${improved ? MINUS : '+'}${Math.abs(delta).toFixed(1)}`}
                  </div>
                  <div style={{ ...LABEL, marginTop: 4 }}>{t('whsConnect.done.span')}</div>
                </div>
              ) : null}
            </div>
          </Panel>

          {/* BELOW THE FLOOR: one honest line. No empty rings, no zero bars. */}
          {belowFloor ? (
            <>
              <div style={{ ...CAPTION, color: MUTE, marginTop: 14 }}>
                {t('whsConnect.done.floor')}
              </div>
            </>
          ) : null}

          {/* b. WHERE YOUR SHOTS GO */}
          {ringsReady ? (
            <>
              <PanelGap />
              <Panel kicker={t('whsConnect.done.shotsLabel')}>
                <div style={{ ...CAPTION, color: MUTE, marginBottom: 16 }}>
                  {t('whsConnect.rings.caption')}
                </div>
                <ParRings
                  par3={{ value: par3!.avg_over, holes: par3!.holes_played }}
                  par4={{ value: par4!.avg_over, holes: par4!.holes_played }}
                  par5={{ value: par5!.avg_over, holes: par5!.holes_played }}
                  size={78}
                  labels={{
                    par3: t('whsConnect.rings.par3'),
                    par4: t('whsConnect.rings.par4'),
                    par5: t('whsConnect.rings.par5'),
                  }}
                  holesLabel={(n) => t('whsConnect.rings.holes', { n })}
                />
              </Panel>
            </>
          ) : null}

          {/* c. YOUR MOST DAMAGING HOLES */}
          {holesReady ? (
            <>
              <PanelGap />
              <Panel
                kicker={t('whsConnect.done.damagingLabel')}
                aside={t('whsConnect.done.damagingAside')}
              >
                {holes.slice(0, 3).map((h, i) => (
                  <div
                    key={`${h.course_id}-${h.hole_no}`}
                    style={{
                      padding: i === 0 ? '0 0 13px' : '13px 0',
                      borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: INK, ...NUM }}>
                          {t('whsConnect.done.holeNo', { n: h.hole_no })}
                        </div>
                        <div style={{ ...LABEL, color: DIM, marginTop: 4, whiteSpace: 'normal' }}>
                          {t('whsConnect.done.parCourse', {
                            par: h.par,
                            course: h.course_name ?? t('whsConnect.done.courseUnknown'),
                          })}
                        </div>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: BAD, flexShrink: 0, ...NUM }}>
                        {`+${Math.abs(h.my_avg_over).toFixed(2)}`}
                      </div>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: TRACK, marginTop: 9 }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: BAD,
                          width: `${maxCost > 0 ? Math.max(6, (Math.abs(h.my_avg_over) / maxCost) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </Panel>
            </>
          ) : null}
        </div>
        <div style={{ height: 24 }} />
      </FlowBody>

      <FooterBar>
        <PrimaryButton onClick={onContinue}>{t('whsConnect.done.cta')}</PrimaryButton>
      </FooterBar>
    </>
  );
};

export default WelcomeAboardScreen;
