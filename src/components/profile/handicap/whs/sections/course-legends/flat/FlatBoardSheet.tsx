/**
 * BRIEF_CHAMPIONS_TAB_REBUILD §4 — THE FULL BOARD.
 *
 * IT IS NOT RICHER THAN THE TAB. Everything it used to know alone — the
 * champion's name, the tenure, the gap — moved up into §3.2, so this sheet has
 * one job: the same board, every row.
 *
 * SAME ROW COMPONENT: FlatBoardRow from ./championsFlatBits, the very component
 * the tab renders. Same ChampionLine, same BoardChips. The sheet holds no copy
 * of any of them. Its ONE addition is the per-row deficit, which only makes
 * sense when every row is visible, and it arrives as a prop on that same row.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { positionsFor } from '../drilldown/_shared/boardParts';
import {
  BoardChips,
  ChampionLine,
  deficitFor,
  FlatBoardRow,
  windowMeta,
  type FlatChip,
  type FlatRow,
} from './championsFlatBits';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';

interface Props {
  open: boolean;
  onClose: () => void;
  courseName: string;
  categories: Array<{ key: LegendCategory; label: string; short: string }>;
  grouped: Map<LegendCategory, { rows: FlatRow[]; total: number }>;
  initialCategory: LegendCategory;
  legendWindow: LegendWindow;
  coursePar?: number | null;
  onCategoryChange?: (from: LegendCategory, to: LegendCategory) => void;
  onRowPress?: (row: FlatRow) => void;
}

export const FlatBoardSheet: React.FC<Props> = ({
  open,
  onClose,
  courseName,
  categories,
  grouped,
  initialCategory,
  legendWindow,
  coursePar = null,
  onCategoryChange,
  onRowPress,
}) => {
  const [activeKey, setActiveKey] = useState<LegendCategory>(initialCategory);

  useEffect(() => {
    if (open) setActiveKey(initialCategory);
  }, [open, initialCategory]);

  const chips: FlatChip[] = useMemo(
    () =>
      categories
        .map((c) => {
          const rows = grouped.get(c.key)?.rows ?? [];
          return rows.length > 0 ? { key: c.key, short: c.short, figure: rows[0].valueDisplay } : null;
        })
        .filter((c): c is FlatChip => c !== null),
    [categories, grouped],
  );

  const active = categories.find((c) => c.key === activeKey) ?? categories[0];
  const entry = active ? grouped.get(active.key) : undefined;
  const rows = entry?.rows ?? [];
  const positions = useMemo(() => positionsFor(rows), [rows]);
  const total = entry?.total ?? rows.length;
  const viewerValue = rows.find((r) => r.isSelf)?.value ?? null;
  const champion = rows[0];

  if (!active) return null;

  return (
    <BottomSheet open={open} onClose={onClose} variant="light" maxHeight="88dvh">
      <div style={{ padding: '4px 20px 8px', fontFamily: SANS }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.19em',
            textTransform: 'uppercase',
            color: A.DIM,
          }}
        >
          {courseName}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: A.INK,
          }}
        >
          {active.label}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: A.MUTE }}>
          {windowMeta(total, legendWindow)}
        </div>

        <div style={{ marginTop: 16 }}>
          <ChampionLine category={active.key} rows={rows} viewerValue={viewerValue} />
        </div>

        {chips.length > 1 ? (
          <div style={{ marginTop: 14 }}>
            <BoardChips
              chips={chips}
              activeKey={active.key}
              onSelect={(k) => {
                if (k === active.key) return;
                onCategoryChange?.(active.key, k);
                setActiveKey(k);
              }}
            />
          </div>
        ) : null}

        <div style={{ marginTop: 14 }}>
          {rows.map((row, i) => (
            <FlatBoardRow
              key={`${row.userId ?? row.name}-${positions[i]}`}
              row={row}
              pos={positions[i]}
              category={active.key}
              coursePar={coursePar}
              rule={i > 0}
              deficit={champion ? deficitFor(active.key, row, champion) : null}
              onPress={onRowPress && row.username ? () => onRowPress(row) : undefined}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 18,
            paddingTop: 12,
            borderTop: `1px solid ${A.HAIRLINE}`,
            fontSize: 11,
            fontWeight: 500,
            color: A.DIM,
          }}
        >
          {total} on the board
        </div>
      </div>
    </BottomSheet>
  );
};

export default FlatBoardSheet;
