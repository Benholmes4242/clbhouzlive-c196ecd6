import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  INK, MUTE, DIM, PANEL, BORDER, GOOD, BAD,
  LABEL_LG, CAPTION, HERO_FIG, NUM,
} from './designTokens';
import { PrimaryButton, FooterBar, Stage, StageHead } from './Primitives';
import { useImportedCounts } from './useImportedCounts';
import {
  useHandicapHistory,
  useScoringBreakdownAllCourses,
  useNemesisHoles,
} from '@/lib/whs/hooks';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ParRings from './ParRings';
import { useRingSize } from './useRingSize';

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
 * THE BREAKDOWN IS NOT READY WHEN THIS SCREEN MOUNTS.
 *
 * get_my_scoring_breakdown_all_courses only counts scores with
 * hole_by_hole_fetched = true. The hole rows themselves are written inside
 * connect-whs (within ~4s of the connection row), but the FLAG flips in a later
 * pass: on the most recent real connection the earliest flagged score was
 * +2m25s after connect-whs returned. So for a couple of minutes the RPC
 * honestly reports 0 complete rounds.
 *
 * That is a LAG, not a thin record - so the screen polls for it and says it is
 * still reading, and only falls back to the record-is-thin line once the poll
 * ceiling passes. It never shows empty rings or a zeroed figure.
 */
const BREAKDOWN_POLL_MS = 5_000;
const BREAKDOWN_CEILING_MS = 180_000;

/**
 * THE FLOOR. Derived from the connected population, not invented: the smallest
 * record in the base today is 55 complete 18-hole rounds and nothing sits under
 * 20, so this floor never fires for a real newly connected member. Eight
 * complete rounds is ~144 holes (~32 par 3s) - the point at which avg_over per
 * par type stops moving with a single bad hole.
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

/**
 * STAGE 5 - THE PAYOFF. The index IS the screen: a HERO_FIG on SURFACE, then
 * where the shots go, then the holes that cost most. No card carries the index.
 */
export const WelcomeAboardScreen: React.FC<Props> = ({
  handicapIndex,
  connectionId,
  onContinue,
}) => {
  const { t } = useTranslation('handicap');
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const ringSize = useRingSize(92, 78);
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

  /* The hole-by-hole flag lands after this screen does. Poll for it, bounded. */
  const completeRounds = breakdown?.complete_rounds ?? 0;
  const [breakdownCeilingHit, setBreakdownCeilingHit] = useState(false);
  useEffect(() => {
    if (completeRounds > 0) return;
    const stop = setTimeout(() => setBreakdownCeilingHit(true), BREAKDOWN_CEILING_MS);
    const poll = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['scoring-breakdown-all-courses'] });
      queryClient.invalidateQueries({ queryKey: ['whs-nemesis-holes'] });
    }, BREAKDOWN_POLL_MS);
    return () => {
      clearTimeout(stop);
      clearInterval(poll);
    };
  }, [completeRounds, queryClient]);

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
  const rounds = counts?.rounds ?? null;
  const headline = countersPending
    ? t('whsConnect.done.headlinePending')
    : rounds
    ? t('whsConnect.done.headlineRounds', { rounds })
    : years && years > 1
    ? t('whsConnect.done.headlineYears', { years })
    : t('whsConnect.done.headline');

  const lead = countersPending ? t('whsConnect.done.subPending') : t('whsConnect.done.sub');

  const par3 = breakdown?.par3 ?? null;
  const par4 = breakdown?.par4 ?? null;
  const par5 = breakdown?.par5 ?? null;

  const ringsReady =
    !!breakdown &&
    completeRounds >= RINGS_MIN_COMPLETE_ROUNDS &&
    !!par3 && !!par4 && !!par5 &&
    par3.holes_played >= RINGS_MIN_HOLES_PER_PAR &&
    par4.holes_played >= RINGS_MIN_HOLES_PER_PAR &&
    par5.holes_played >= RINGS_MIN_HOLES_PER_PAR;

  const holes = (nemesis ?? []).filter((h) => Number.isFinite(h.my_avg_over));
  const holesReady = ringsReady && holes.length >= 3;

  /* Still arriving vs genuinely thin. Only the second gets the floor line. */
  const breakdownLanding = !ringsReady && !breakdownCeilingHit;
  const belowFloor = !ringsReady && breakdownCeilingHit;

  return (
    <>
      <Stage>
        <StageHead
          kicker={t('whsConnect.done.kicker')}
          kickerColor={GOOD}
          headline={headline}
          lead={lead}
        />

        {/* a. THE INDEX. No card - the figure is the screen. */}
        <div style={{ marginTop: 40 }}>
          <div style={{ ...LABEL_LG, marginBottom: 12 }}>{t('whsConnect.done.indexLabel')}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={HERO_FIG}>
              {countersPending && handicapIndex === null ? DASH : fmtIndex(handicapIndex)}
            </div>
            {delta !== null ? (
              <div style={{ paddingBottom: 8 }}>
                <div
                  style={{
                    fontSize: 17,
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
                <div style={{ ...LABEL_LG, marginTop: 6 }}>{t('whsConnect.done.span')}</div>
              </div>
            ) : null}
          </div>
          {counts?.courses && sinceYear ? (
            <div style={{ ...LABEL_LG, color: DIM, marginTop: 14 }}>
              {t('whsConnect.done.coursesSince', { courses: counts.courses, year: sinceYear })}
            </div>
          ) : null}
        </div>

        {/* b. WHERE YOUR SHOTS GO */}
        {ringsReady ? (
          <div style={{ marginTop: 44 }}>
            <div style={{ ...LABEL_LG, marginBottom: 6 }}>{t('whsConnect.done.shotsLabel')}</div>
            <div style={{ ...CAPTION, color: MUTE, marginBottom: 22 }}>
              {t('whsConnect.rings.caption')}
            </div>
            <ParRings
              par3={{ value: par3!.avg_over, holes: par3!.holes_played }}
              par4={{ value: par4!.avg_over, holes: par4!.holes_played }}
              par5={{ value: par5!.avg_over, holes: par5!.holes_played }}
              size={ringSize}
              labels={{
                par3: t('whsConnect.rings.par3'),
                par4: t('whsConnect.rings.par4'),
                par5: t('whsConnect.rings.par5'),
              }}
              holesLabel={(n) => t('whsConnect.rings.holes', { n })}
            />
          </div>
        ) : null}

        {/* STILL LANDING: the flag on each score flips after this screen mounts. */}
        {breakdownLanding ? (
          <div style={{ marginTop: 44 }}>
            <div style={{ ...LABEL_LG, marginBottom: 10 }}>{t('whsConnect.done.shotsLabel')}</div>
            <div style={{ ...CAPTION, color: MUTE }}>{t('whsConnect.done.shotsLanding')}</div>
          </div>
        ) : null}

        {/* GENUINELY THIN: one honest line. No empty rings, no zero bars. */}
        {belowFloor ? (
          <div style={{ ...CAPTION, color: MUTE, marginTop: 44 }}>
            {t('whsConnect.done.floor')}
          </div>
        ) : null}

        {/* c. THE HOLES THAT COST MOST. White squares on SURFACE. */}
        {holesReady ? (
          <div style={{ marginTop: 44 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 14,
              }}
            >
              <div style={LABEL_LG}>{t('whsConnect.done.damagingLabel')}</div>
              <div style={LABEL_LG}>{t('whsConnect.done.damagingAside')}</div>
            </div>
            {holes.slice(0, 3).map((h) => (
              <div
                key={`${h.course_id}-${h.hole_no}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                {/* The white square: the hole number, nothing else. */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: `1px solid ${BORDER}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: INK,
                      ...NUM,
                    }}
                  >
                    {h.hole_no}
                  </span>
                  <span style={{ ...LABEL_LG, fontSize: 7 }}>{`PAR ${h.par}`}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                      color: INK,
                    }}
                  >
                    {h.course_name ?? t('whsConnect.done.courseUnknown')}
                  </div>
                  <div style={{ ...LABEL_LG, color: DIM, marginTop: 6 }}>
                    {t('whsConnect.rings.holes', { n: h.times_played })}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: BAD,
                    flexShrink: 0,
                    ...NUM,
                  }}
                >
                  {`+${Math.abs(h.my_avg_over).toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ height: 28 }} />
      </Stage>

      <FooterBar>
        <PrimaryButton onClick={onContinue}>{t('whsConnect.done.cta')}</PrimaryButton>
      </FooterBar>
    </>
  );
};

export default WelcomeAboardScreen;
