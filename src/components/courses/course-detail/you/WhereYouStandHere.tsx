/**
 * BRIEF_YOU_TAB_STANDINGS_PAIRED — "Where you stand here" as a paired grid:
 * one row per BOARD, the two windows side by side (90 days | All time).
 *
 * Row order is BOARD_ORDER (declared), never the RPC's strength order. A board
 * with no card in a window renders an EMPTY cell — not a dash. Unknown
 * categories are never dropped: they get their own row after the seven known
 * boards. The standing line is not shown here (it stays on the Trophy Room).
 *
 * Rank tone, unchanged:
 *   medal_earned && rank === 1  →  amber
 *   !medal_earned               →  dim
 *   otherwise                   →  ink
 * Tenure cells show the value only — per CELL, not per row.
 */
import React from 'react';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection, { ABOUT_KICKER } from '../about/AboutSection';
import { ordinal } from './youBits';
import {
  BOARD_LABELS,
  BOARD_ORDER,
  CATEGORY_BOARD,
  categoryLabel,
  formatValue,
  type StandingWindow,
} from '@/components/profile/handicap/whs/gam/trophy-room/career/standings';
import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';

const CELL_W = 86;

function rankTone(row: MemberStandingRow): string {
  if (!row.medal_earned) return A.DIM;
  return row.rank === 1 ? A.AMBER : A.INK;
}

interface BoardRow {
  key: string;
  label: string;
  cells: Partial<Record<StandingWindow, MemberStandingRow>>;
}

export function pairStandings(rows: MemberStandingRow[]): BoardRow[] {
  const known = new Map<string, BoardRow>();
  const unknown: BoardRow[] = [];
  for (const row of rows) {
    const m = CATEGORY_BOARD[row.category];
    if (m) {
      let b = known.get(m.board);
      if (!b) {
        b = { key: m.board, label: BOARD_LABELS[m.board], cells: {} };
        known.set(m.board, b);
      }
      b.cells[m.window] = row;
    } else {
      const w: StandingWindow = row.category.endsWith('_90d') ? '90d' : 'all';
      unknown.push({ key: row.category, label: categoryLabel(row.category), cells: { [w]: row } });
    }
  }
  const ordered = BOARD_ORDER.map((k) => known.get(k)).filter((b): b is BoardRow => !!b);
  return [...ordered, ...unknown];
}

const Cell: React.FC<{ window: StandingWindow; row?: MemberStandingRow }> = ({ window, row }) => (
  <div data-you-standing-cell={window} style={{ width: CELL_W, flexShrink: 0, textAlign: 'right' }}>
    {row ? (
      <>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            color: A.INK,
            fontFamily: SANS,
            ...FIGS,
          }}
        >
          {formatValue(row)}
        </div>
        {!row.is_tenure ? (
          <div
            data-you-standing-rank="true"
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.15,
              color: rankTone(row),
              fontFamily: SANS,
              ...FIGS,
            }}
          >
            {ordinal(row.rank)} /{row.field_size}
          </div>
        ) : null}
      </>
    ) : null}
  </div>
);

const WhereYouStandHere: React.FC<{ rows: MemberStandingRow[]; onAllBoards?: () => void }> = ({
  rows,
  onAllBoards,
}) => {
  if (rows.length === 0) return null;
  const boards = pairStandings(rows);
  return (
    <AboutSection
      heading="Where you stand here"
      {...(onAllBoards ? { meta: 'All boards', onMetaPress: onAllBoards } : {})}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            paddingBottom: 7,
            borderBottom: `1px solid ${A.SOFT}`,
          }}
        >
          <div style={{ flex: 1 }} />
          <div style={{ ...ABOUT_KICKER, width: CELL_W, textAlign: 'right' }}>90 days</div>
          <div style={{ ...ABOUT_KICKER, width: CELL_W, textAlign: 'right' }}>All time</div>
        </div>
        {boards.map((b, i) => (
          <div
            key={b.key}
            data-you-standing-board={b.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 0',
              borderTop: i > 0 ? `1px solid ${A.SOFT}` : undefined,
            }}
          >
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.25,
                color: A.MUTE,
                fontFamily: SANS,
              }}
            >
              {b.label}
            </span>
            <Cell window="90d" row={b.cells['90d']} />
            <Cell window="all" row={b.cells.all} />
          </div>
        ))}
      </div>
    </AboutSection>
  );
};

export default WhereYouStandHere;
