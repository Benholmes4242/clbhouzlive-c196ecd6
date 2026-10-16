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
 * BRIEF_MECHANISM_PAIRING_2: the selection defaults to the newest round in the
 * twenty, and a tap only selects — this section never opens RoundDetailSheet.
 * The two-line detail block always renders, so the section never moves.
 * NET IS ABSENT, NOT APPROXIMATED: whs_scores carries no net figure, so the
 * net slot stays empty rather than being derived.
 *
 * NINE HOLES CARRY NO MARK HERE: WHS states every differential on an
 * eighteen-hole basis, so every point is already on one scale.
 */
import { countsTowardIndex, counterWindow } from '@/lib/whs/counting';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/* Figures use a TRUE MINUS (U+2212), never a hyphen. */
import { fmtDiff } from '@/lib/whs/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores } from '@/lib/whs/hooks';
import { formatDayMonthShortGB } from '@/i18n/format';

import { HcpSection } from './HcpSection';
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
const SLOT_H = 40;

interface Props {
  connectionId: string;
  userId?: string | null;
}

/** To-par suffix: E, +n, or a true-minus figure. */
const fmtToPar = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `\u2212${-n}`);

const RoundsThatCountSection: React.FC<Props> = ({ connectionId, userId = null }) => {
  const { t } = useTranslation(['common']);
  const { data: allScores, isLoading } = useAllScores(connectionId);

  /* BRIEF_MECHANISM_PAIRING: ONE selection, by ROUND ID (never by differential —
     duplicate differentials are real). Bars and chips both read it; it
     persists after the sheet closes; re-tapping re-opens rather than clears. */
  const [selId, setSelId] = useState<string | null>(null);

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
        gross: r.adjusted_gross ?? null,
        par: r.course_par ?? null,
        /* Not carried by whs_scores — absent, never derived (AA3). */
        net: null as number | null,
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

  const selIdxRaw = selId != null ? window20.findIndex((r) => r.id === selId) : -1;
  /* AA4: no explicit choice yet → the newest round (rightmost bar). */
  const selIdx = selIdxRaw >= 0 ? selIdxRaw : window20.length ? window20.length - 1 : null;
  const activeId = selIdx != null ? window20[selIdx].id : null;
  const selected = selIdx != null ? window20[selIdx] : null;
  const roundLabel = (r: (typeof window20)[number]) =>
    t(r.is_counter ? 'common:handicap.mechanism.roundLabelCounts' : 'common:handicap.mechanism.roundLabelNotCounting', {
      date: formatDayMonthShortGB(r.play_date),
      course: r.course_name ?? '',
      diff: r.diff != null ? fmtDiff(r.diff) : '',
    });

  const onSelect = (i: number) => {
    const r = window20[i];
    if (!r) return;
    setSelId(r.id);
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

        {/* AA2 detail block — two lines, always rendered (newest by default). */}
        <div data-testid="mechanism-detail" style={{ height: SLOT_H, marginBottom: 6 }}>
          {selected && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <span
                  data-testid="detail-course"
                  style={{
                    fontSize: 12.5, fontWeight: 700, color: CHART.INK, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {selected.course_name ?? ''}
                </span>
                <span data-testid="detail-date" style={{ fontSize: 11, fontWeight: 600, color: CHART.DIM, flexShrink: 0, ...FIG }}>
                  {formatDayMonthShortGB(selected.play_date)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4, whiteSpace: 'nowrap' }}>
                {([
                  ['gross', selected.gross != null
                    ? `${selected.gross}${selected.par != null ? ` (${fmtToPar(selected.gross - selected.par)})` : ''}`
                    : ''],
                  ['net', selected.net != null ? String(selected.net) : ''],
                  ['diff', selected.diff != null ? fmtDiff(selected.diff) : ''],
                ] as const).map(([k, v]) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CHART.DIM }}>
                      {t(`common:handicap.mechanism.detail.${k}`)}
                    </span>
                    <span data-testid={`detail-${k}`} style={{ fontSize: 12.5, fontWeight: 700, color: CHART.INK, ...FIG }}>{v}</span>
                  </span>
                ))}
                <span
                  data-testid="detail-counts"
                  style={{ fontSize: 12.5, fontWeight: 700, color: selected.is_counter ? A.IMPROVED : CHART.MUTE }}
                >
                  {selected.is_counter
                    ? t('common:handicap.roundsThatCount.counts')
                    : t('common:handicap.roundsThatCount.doesNotCount')}
                </span>
              </div>
            </>
          )}
        </div>

        <LastTwentyBars
          rounds={window20.map((r) => ({ diff: r.diff, counts: r.is_counter }))}
          cut={cutLine != null ? { value: cutLine } : null}
          oldestLabel={t('common:handicap.mechanism.oldest', { date: formatDayMonthShortGB(window20[0].play_date) })}
          newestLabel={t('common:handicap.mechanism.newest', { date: formatDayMonthShortGB(window20[window20.length - 1].play_date) })}
          selectedIndex={selIdx}
          onSelectIndex={onSelect}
          labels={window20.map(roundLabel)}
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
                <button
                  key={r.id}
                  type="button"
                  data-round-id={r.id}
                  aria-label={roundLabel(r)}
                  aria-pressed={activeId === r.id}
                  onClick={() => onSelect(window20.findIndex((w) => w.id === r.id))}
                  style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                    gap: 2, padding: '6px 8px', margin: 0, background: 'transparent',
                    font: 'inherit', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    border: `1px solid ${CHART.BORDER}`, borderRadius: 8,
                    opacity: activeId != null && activeId !== r.id ? 0.55 : 1,
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
                </button>
              ))}
            </div>
          </div>
        )}
      </HcpSection>

    </>
  );
};

export default RoundsThatCountSection;
