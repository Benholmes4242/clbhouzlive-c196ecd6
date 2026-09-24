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

/* Figures use a TRUE MINUS (U+2212), never a hyphen. */
import { fmtDiff } from '@/lib/whs/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores } from '@/lib/whs/hooks';
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

  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const total = allScores?.length ?? 0;

  /**
   * Last 20, OLDEST FIRST. ONE SOURCE FOR THE COUNTER SET: is_counter as it
   * arrives on useAllScores (whs_scores), the same read the posted-history
   * sheet uses. The previous useCounters set was a second query filtered
   * is_counter = true with .limit(8) — eight is what WHS uses at twenty or
   * more rounds and not what it uses below that, so the limit asserted a rule
   * the schema does not enforce.
   */
  const window20 = useMemo(() => {
    if (!allScores || allScores.length === 0) return [];
    return [...allScores.slice(0, 20)]
      .sort((a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime())
      .map((r) => ({
        id: r.id,
        play_date: r.play_date,
        diff: r.handicap_differential ?? null,
        is_counter: !!r.is_counter,
        course_id: r.course_id ?? null,
        course_name: r.course?.name ?? null,
        course_rating: r.course_rating ?? null,
        slope_rating: r.slope_rating ?? null,
      }));
  }, [allScores]);

  /* THE COURSE THE LINE IS READ AT: most frequent course_id in the window,
     ties broken by the most recent round; that round's name and ratings.
     A course lacking either rating is skipped. Null = no score conversion
     anywhere in this section; a differential is never printed as a score. */
  const course = useMemo(() => {
    const stats = new Map<string, { n: number; lastIdx: number }>();
    window20.forEach((r, i) => {
      if (!r.course_id) return;
      const e = stats.get(r.course_id) ?? { n: 0, lastIdx: -1 };
      e.n += 1;
      e.lastIdx = i; // oldest-first, so the last seen is the most recent
      stats.set(r.course_id, e);
    });
    const ranked = [...stats.entries()].sort((a, b) => b[1].n - a[1].n || b[1].lastIdx - a[1].lastIdx);
    for (const [, e] of ranked) {
      const r = window20[e.lastIdx];
      if (r.course_rating != null && r.slope_rating != null && r.course_name) {
        return { name: r.course_name, rating: r.course_rating, slope: r.slope_rating };
      }
    }
    return null;
  }, [window20]);

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
  // nothing the member can feel. Returns the index too, for the round's date.
  const falling = (() => {
    for (let i = 0; i < Math.min(FALLING_HORIZON, window20.length); i++) {
      if (window20[i].is_counter) return { idx: i, fallsIn: i + 1 };
    }
    return null;
  })();

  /* THE COUNTS-BELOW LINE. It rules across at the WORST differential that
     still counts, so every counter sits on or below it and every non-counter
     above. Null when the counter set is empty — nothing to rule. */
  const counterDiffs = window20.filter((r) => r.is_counter && r.diff != null).map((r) => r.diff as number);
  const cutLine = counterDiffs.length ? Math.max(...counterDiffs) : null;
  const nonCounterDiffs = window20.filter((r) => !r.is_counter && r.diff != null).map((r) => r.diff as number);
  const nextDiff = nonCounterDiffs.length ? Math.min(...nonCounterDiffs) : null;

  /* PLAIN ROUNDING, deliberately NOT the next-round ceil-minus-one: that is a
     score to BEAT; this only describes where the line already sits. */
  const scoreAt = (diff: number) =>
    course ? Math.round((diff * course.slope) / 113 + course.rating) : null;

  const cutScore = cutLine != null ? scoreAt(cutLine) : null;
  const nextScore = nextDiff != null ? scoreAt(nextDiff) : null;
  const headroom = cutScore != null && nextScore != null ? nextScore - cutScore : null;

  /* SEPARATE KEYS, NOT AN INTERPOLATED PLURAL. 0 is its own state (the next
     round in line is level with the last one counting), never "0 shots". */
  const meta =
    headroom == null
      ? undefined
      : headroom === 0
        ? t('common:handicap.roundsThatCount.headroomLevel')
        : headroom === 1
          ? t('common:handicap.roundsThatCount.headroomOne')
          : t('common:handicap.roundsThatCount.headroomOther', { count: headroom });

  const bodyLine =
    nextDiff == null
      ? t('common:handicap.roundsThatCount.bodyLineNoNext')
      : course && cutScore != null && nextScore != null
        ? t('common:handicap.roundsThatCount.bodyLine', {
            count: counterCount,
            cut: cutScore,
            course: course.name,
            next: nextScore,
          })
        : t('common:handicap.roundsThatCount.bodyLineNoCourse', { count: counterCount });

  const fallLine = falling
    ? t('common:handicap.roundsThatCount.fallLine', {
        date: formatDayMonthShortGB(window20[falling.idx].play_date),
        falls: t('common:handicap.roundsThatCount.fallsIn', { count: falling.fallsIn }),
      })
    : null;

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
        meta={meta}
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

        <CountingScatter
          rounds={points}
          showLegend={false}
          selectedIndex={selIdx}
          onSelectIndex={onSelect}
          cutLine={cutLine}
          cutLabel={cutScore != null ? String(cutScore) : null}
        />

        <p style={{ margin: '14px 0 0', fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
          {bodyLine}
        </p>
        {fallLine && (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
            {fallLine}
          </p>
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
