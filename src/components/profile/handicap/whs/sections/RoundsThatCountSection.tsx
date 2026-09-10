/**
 * RoundsThatCountSection — SECTION E of the one-page handicap brief.
 *
 * Flat replacement for RoundsThatCountCard: no panel, no border, no radius, no
 * background tint. Kicker, heading, "{n} count" meta, a reserved selection
 * slot, the existing CountingScatter, and ONE generated sentence.
 *
 * WHAT IS GONE FROM THIS SECTION, BY CONSTRUCTION:
 *  - The NEXT ROUND / "{target} CUTS" / CAN'T RISE footer strip. Section C is
 *    the only next-round statement on this page. With the strip gone this
 *    section makes NO call to projectNextRound at all, so the below-20
 *    fixed-divisor fault it carried is removed rather than gated.
 *  - The separate FALLING OFF SOON progress bar and its -{x} / IN {n} readout:
 *    folded into the sentence.
 *  - The COUNTS / FALLING OFF legend rows: the green/neutral distinction plus
 *    the sentence carry it (showLegend={false} on the chart).
 *
 * NO DEFAULT SELECTION. The newest round is Section D in full, three sections
 * above; defaulting the row here would print the same round on the page twice.
 * The slot's height is reserved from mount so the chart never moves.
 *
 * NINE HOLES CARRY NO MARK HERE: WHS states every differential on an
 * eighteen-hole basis, so every point is already on one scale.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores, useCounters } from '@/lib/whs/hooks';
import { formatDayMonthShortGB } from '@/i18n/format';

import { HcpSection } from './HcpSection';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { CHART } from '../charts';
import CountingScatter, { type CountingRound } from '../charts/CountingScatter';

/** A full rolling window. Below this the section states the sample instead. */
const MIN_ROUNDS = 20;
/** Counters among the five oldest of a full window are the ones about to go. */
const FALLING_HORIZON = 5;

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
  const { data: counters } = useCounters(connectionId);

  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const total = allScores?.length ?? 0;

  /** Last 20, OLDEST FIRST, with the counter flag from the existing set. */
  const window20 = useMemo(() => {
    if (!allScores || allScores.length === 0) return [];
    const counterIds = new Set((counters ?? []).map((c) => c.id));
    return [...allScores.slice(0, 20)]
      .sort((a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime())
      .map((r) => ({
        id: r.id,
        play_date: r.play_date,
        diff: r.handicap_differential ?? null,
        is_counter: counterIds.has(r.id),
      }));
  }, [allScores, counters]);

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

  const counterCount = window20.filter((r) => r.is_counter).length;

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

  const points: CountingRound[] = window20.map((r) => ({
    diff: r.diff ?? 0,
    state: r.is_counter ? 'counts' : 'none',
  }));

  // Falls-off-in: chronological position i drops out after i+1 more rounds.
  // Only counters inside the horizon matter — a non-counter leaving changes
  // nothing the member can feel.
  const fallsIn = (() => {
    const hits = window20
      .slice(0, FALLING_HORIZON)
      .map((r, i) => (r.is_counter ? i + 1 : null))
      .filter((v): v is number => v != null);
    return hits.length ? Math.min(...hits) : null;
  })();

  const sentence =
    fallsIn != null
      ? t('common:handicap.roundsThatCount.body', {
          count: counterCount,
          falls: t('common:handicap.roundsThatCount.fallsIn', { count: fallsIn }),
        })
      : t('common:handicap.roundsThatCount.bodyNoFall', { count: counterCount });

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
        kicker={t('common:handicap.roundsThatCount.eyebrow')}
        heading={t('common:handicap.roundsThatCount.heading')}
        meta={t('common:handicap.roundsThatCount.meta', { count: counterCount })}
      >
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
                  {selected.diff != null ? selected.diff.toFixed(1) : ''}
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

        <CountingScatter
          rounds={points}
          showLegend={false}
          selectedIndex={selIdx}
          onSelectIndex={onSelect}
          cutLine={cutLine}
        />

        <p style={{ margin: '14px 0 0', fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
          {sentence}
        </p>
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
