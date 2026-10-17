/**
 * YOU_TAB_BOARD_LIST_1 AC4 — THE one board list for the You tab's states 1, 2
 * and 3. The held course record (when anyone holds it) is its own row with
 * the score and "Held" in muted ink; then EVERY open all-time board in
 * "Open" medal gold. The open set is the SAME holder map, over the SAME
 * order, that useCourseRecordSummary.unclaimedCount counts, so the open rows
 * always equal the count (AC1). Do not fork this per branch.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatLegendValueCompact } from '@/lib/gam/visuals';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import type { CourseLegendRow, LegendCategory } from '@/lib/gam/types';
import { CHAMPIONS_ORDER_ALL_TIME } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';

/** Board names from the state-1 vocabulary (courseDetail.youTab.unclaimed.boards). */
export const BOARD_KEY: Record<string, string> = {
  lowest_gross_all_time: 'lowestGross',
  lowest_net_all_time: 'lowestNet',
  best_stableford_all_time: 'bestStableford',
  most_aces_all_time: 'mostAces',
  most_albatrosses_all_time: 'mostAlbatrosses',
  most_eagles_all_time: 'mostEagles',
  most_birdies_all_time: 'mostBirdies',
  most_rounds_all_time: 'mostRounds',
  best_score_diff_all_time: 'bestDifferential',
};

/** The open boards: identical predicate to unclaimedCount. */
export function openBoardCategories(holders: Map<LegendCategory, CourseLegendRow>): LegendCategory[] {
  return CHAMPIONS_ORDER_ALL_TIME.filter((c) => !holders.has(c));
}

interface Props {
  holders: Map<LegendCategory, CourseLegendRow>;
  recordValue: number | null;
  thinField?: boolean;
  marginTop?: number;
}

export const BoardList: React.FC<Props> = ({ holders, recordValue, thinField = false, marginTop = 14 }) => {
  const { t } = useTranslation('courses');
  const rows: { key: string; label: string; held: boolean }[] = [];
  if (recordValue != null) {
    rows.push({
      key: 'record',
      label: t(`courseDetail.youTab.grabs.${thinField ? 'grossHeldThin' : 'grossHeld'}`, {
        value: formatLegendValueCompact('lowest_gross_all_time', recordValue),
      }),
      held: true,
    });
  }
  openBoardCategories(holders).forEach((c) =>
    rows.push({ key: c, label: t(`courseDetail.youTab.unclaimed.boards.${BOARD_KEY[c] ?? c}`), held: false }),
  );
  return (
    <div style={{ marginTop }}>
      {rows.map((r, i) => (
        <div
          key={r.key}
          data-board-row={r.held ? 'held' : 'open'}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${A.SOFT}` : undefined, fontFamily: SANS,
          }}
        >
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: A.BODY, ...FIGS }}>{r.label}</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: r.held ? A.DIM : MEDAL_GOLD }}>
            {r.held ? t('courseDetail.youTab.grabs.heldTag') : t('courseDetail.youTab.unclaimed.open')}
          </div>
        </div>
      ))}
    </div>
  );
};
