/**
 * RoundsThatCountSection — PHASE 4 "THE MECHANISM" of
 * BRIEF_HANDICAP_TAB_REBUILD (replaces the Section E grammar).
 *
 * Kicker THE MECHANISM, title "Eight of your last twenty", the §4.1 caption,
 * LastTwentyBars (kept: twenty differentials oldest-left, min-anchored scale,
 * counting state from is_counter via countsTowardIndex — never a client-side
 * comparison), the amber cut line at the eighth-best differential, date axis
 * labels, then THE COUNTING EIGHT chip box ending after its chips.
 *
 * WHAT IS GONE, BY CONSTRUCTION:
 *  - The NEXT ROUND / "{target} CUTS" footer strip (Section C owns that).
 *  - The FALLING OFF SOON readout and the generated caption/fall lines:
 *    phase 3's AgeingOutSection owns the expiry warning now.
 *  - Boundary label and NEXT IN LINE row (BRIEF_HANDICAP_TAB_REBUILD_4A).
 *    The amber rule stays; AgeingOutSection owns replacement advice.
 *
 * NO DEFAULT SELECTION. The newest round is Section D in full, three sections
 * above; defaulting the row here would print the same round on the page twice.
 * The slot's height is reserved from mount so the chart never moves.
 *
 * NINE HOLES CARRY NO MARK HERE: WHS states every differential on an
 * eighteen-hole basis, so every point is already on one scale.
 */
import { countsTowardIndex, counterWindow } from '@/lib/whs/counting';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* Figures use a TRUE MINUS (U+2212), never a hyphen. */
import { fmtDiff } from '@/lib/whs/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores } from '@/lib/whs/hooks';
import { formatDayMonthShortGB } from '@/i18n/format';

import { HcpSection } from './HcpSection';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { CHART } from '../charts';
import LastTwentyBars from '../charts/LastTwentyBars';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/** A full rolling window. Below this the section states the sample instead. */
const MIN_ROUNDS = 20;

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

/** Reserved height of the selection slot: 14/600 name row + 16 figure row. */
const SLOT_H = 26;

interface Props {
  connectionId: string;
  userId?: string | null;
}

const RoundsThatCountSection: React.FC<Props> = ({ connectionId, userId = null }) => {
  const { t } = useTranslation(['common']);
  const { data: allScores, isLoading } = useAllScores(connectionId);

  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const total = allScores?.length ?? 0;

  /**
   * Last 20, OLDEST FIRST. ONE SOURCE FOR THE COUNTER SET: is_counter as it
   * arrives on useAllScores (whs_scores), the same read the posted-history
   * sheet uses.
   */
  const window20 = useMemo(() => {
    if (!allScores || allScores.length === 0) return [];
    return counterWindow(allScores)
      .sort((a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime())
      .map((r) => ({
        id: r.id,
        play_date: r.play_date,
        diff: r.handicap_differential ?? null,
        is_counter: countsTowardIndex(r),
        course_name: r.course?.name ?? null,
      }));
  }, [allScores]);

  const withheld = !isLoading && total > 0 && total < MIN_ROUNDS;
  const withheldFired = useRef(false);
  useEffect(() => {
    if (!withheld || withheldFired.current) return;
    withheldFired.current = true;
    analyticsEvents.track('handicap_section_withheld', {
      section: 'rounds_that_count',
      sample: total,
      required: MIN_ROUNDS,
    });
  }, [withheld, total]);

  if (isLoading || total === 0) return null;

  // ── Withheld: fewer than a full window ────────────────────────────────
  if (withheld) {
    return (
      <HcpSection
        hairline
        kicker={t('common:handicap.roundsThatCount.eyebrow')}
        heading={t('common:handicap.roundsThatCount.heading')}
        meta={t('common:handicap.roundsThatCount.metaAll', { count: total })}
      >
        <p style={{ margin: 0, fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
          {t('common:handicap.roundsThatCount.withheldBody', { count: total })}
        </p>
      </HcpSection>
    );
  }

  /* THE CUT (§4.4): the highest differential among rounds where is_counter
     is true — the eighth-best. Every counter sits on or under it, every
     non-counter above, so the line and the bar colours cannot disagree.
     Null when the counter set is empty — nothing to rule. */
  const counters = window20.filter((r) => r.is_counter && r.diff != null);
  const cutLine = counters.length ? Math.max(...counters.map((r) => r.diff as number)) : null;
  const countingEight = [...counters].sort((a, b) => (a.diff as number) - (b.diff as number));

  const selected = selIdx != null ? window20[selIdx] : null;

  const onSelect = (i: number) => {
    const r = window20[i];
    if (!r) return;
    setSelIdx(i);
    analyticsEvents.track('handicap_counting_point_tapped', {
      score_id: r.id,
      counts: r.is_counter,
      position: i + 1,
      of: window20.length,
    });
  };

  return (
    <>
      <HcpSection
        hairline
        kicker={t('common:handicap.mechanism.kicker')}
        heading={t('common:handicap.mechanism.title')}
      >
        {/* §4.1 caption. */}
        <p style={{ margin: '0 0 14px', fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: CHART.MUTE }}>
          {t('common:handicap.mechanism.caption')}
        </p>

        {/* Selection slot — height reserved from mount, empty until a tap. */}
        <div style={{ height: SLOT_H, marginBottom: 6 }}>
          {selected && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label={t('common:handicap.roundsThatCount.openRound', {
                date: formatDayMonthShortGB(selected.play_date),
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                width: '100%',
                height: SLOT_H,
                padding: 0,
                margin: 0,
                border: 'none',
                borderRadius: 0,
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: CHART.INK, ...FIG }}>
                  {formatDayMonthShortGB(selected.play_date)}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: selected.is_counter ? CHART.DOWN : CHART.MUTE,
                    ...FIG,
                  }}
                >
                  {selected.diff != null ? fmtDiff(selected.diff) : ''}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: selected.is_counter ? CHART.DOWN : CHART.DIM,
                  }}
                >
                  {selected.is_counter
                    ? t('common:handicap.roundsThatCount.counts')
                    : t('common:handicap.roundsThatCount.doesNotCount')}
                </span>
              </span>
              <ChevronRight size={16} color={CHART.FAINT} strokeWidth={2.4} style={{ flexShrink: 0 }} />
            </button>
          )}
        </div>

        <LastTwentyBars
          rounds={window20.map((r) => ({ diff: r.diff, counts: r.is_counter }))}
          cut={cutLine != null ? { value: cutLine } : null}
          oldestLabel={t('common:handicap.mechanism.oldest', { date: formatDayMonthShortGB(window20[0].play_date) })}
          newestLabel={t('common:handicap.mechanism.newest', { date: formatDayMonthShortGB(window20[window20.length - 1].play_date) })}
          selectedIndex={selIdx}
          onSelectIndex={onSelect}
        />

        {/* §4.6 THE COUNTING EIGHT — chips best first, each with a course tag. */}
        {countingEight.length > 0 && (
          <div
            style={{
              marginTop: 14,
              border: `1px solid ${A.IMPROVED}`,
              borderRadius: 12,
              padding: 11,
            }}
          >
            <div
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: A.IMPROVED,
              }}
            >
              {t('common:handicap.mechanism.countingEight')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
              {countingEight.map((r) => (
                <span
                  key={r.id}
                  style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                    gap: 2, padding: '6px 8px',
                    border: `1px solid ${CHART.BORDER}`, borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: CHART.INK, ...FIG }}>
                    {fmtDiff(r.diff as number)}
                  </span>
                  <span
                    style={{
                      fontSize: 8.5, fontWeight: 700, letterSpacing: '0.09em',
                      textTransform: 'uppercase', color: CHART.DIM,
                      maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {r.course_name ?? ''}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </HcpSection>

      {selected && (
        <RoundDetailSheet
          scoreId={selected.id}
          connectionId={connectionId}
          profileUserId={userId ?? null}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          handicapDelta={null}
        />
      )}
    </>
  );
};

export default RoundsThatCountSection;
