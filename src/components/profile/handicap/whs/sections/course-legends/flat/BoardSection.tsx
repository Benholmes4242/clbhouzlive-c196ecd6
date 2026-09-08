/**
 * BRIEF_CHAMPIONS_TAB_REBUILD §3.2 — THE BOARD.
 *
 * Flat: chips, champion line, hairline, up to six rows, see-all. No Panel, no
 * column headers, no tinted band on the viewer's row, no chip for a board that
 * has no holder.
 *
 * THE WINDOW TOGGLE lives here and governs this section and the sheet only —
 * never Your crowns. It is ABSENT when the course has no 90-day rows, and the
 * meta states which window is applied.
 *
 * DEVIATION, reported: DiscoverSectionHeading's right slot takes a STRING only
 * and must not be modified, so the meta keeps that slot and the toggle sits
 * immediately beneath it, right-aligned on the same block.
 */
import React, { useMemo } from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { AboutSection, AboutHairline } from '@/components/courses/course-detail/about/AboutSection';
import { positionsFor } from '../drilldown/_shared/boardParts';
import {
  BoardChips,
  ChampionLine,
  FlatAction,
  FlatBoardRow,
  windowMeta,
  type FlatChip,
  type FlatRow,
} from './championsFlatBits';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';

const MAX_ROWS = 6;

export interface BoardCategoryDescriptor {
  key: LegendCategory;
  label: string;
  short: string;
}

interface Props {
  categories: BoardCategoryDescriptor[];
  grouped: Map<LegendCategory, { rows: FlatRow[]; total: number }>;
  activeKey: LegendCategory;
  onSelectCategory: (key: LegendCategory) => void;
  legendWindow: LegendWindow;
  /** Absent when the course has no 90-day rows at all. */
  canSwitchWindow: boolean;
  onWindowChange: (w: LegendWindow) => void;
  coursePar: number | null;
  onOpenFull: (cat: LegendCategory) => void;
  onRowPress?: (row: FlatRow) => void;
}

export const BoardSection: React.FC<Props> = ({
  categories,
  grouped,
  activeKey,
  onSelectCategory,
  legendWindow,
  canSwitchWindow,
  onWindowChange,
  coursePar,
  onOpenFull,
  onRowPress,
}) => {
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
  if (!active) return null;

  const entry = grouped.get(active.key);
  const rows = entry?.rows ?? [];
  if (rows.length === 0) return null;

  const positions = positionsFor(rows);
  const shown = rows.slice(0, MAX_ROWS);
  const total = entry?.total ?? rows.length;
  const viewerValue = rows.find((r) => r.isSelf)?.value ?? null;

  return (
    <AboutSection heading={active.label} meta={windowMeta(total, legendWindow)} space={30}>
      {canSwitchWindow ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 12, fontFamily: SANS }}>
          {(['all_time', '90d'] as LegendWindow[]).map((w) => {
            const on = w === legendWindow;
            return (
              <button
                key={w}
                type="button"
                onClick={() => onWindowChange(w)}
                aria-pressed={on}
                style={{
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 700,
                  color: on ? A.INK : A.DIM,
                  cursor: 'pointer',
                }}
              >
                {w === 'all_time' ? 'All time' : '90 days'}
              </button>
            );
          })}
        </div>
      ) : null}

      {chips.length > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <BoardChips chips={chips} activeKey={active.key} onSelect={onSelectCategory} />
        </div>
      ) : null}

      <ChampionLine category={active.key} rows={rows} viewerValue={viewerValue} />
      <AboutHairline style={{ marginTop: 12 }} />

      {shown.map((row, i) => (
        <FlatBoardRow
          key={`${row.userId ?? row.name}-${positions[i]}`}
          row={row}
          pos={positions[i]}
          category={active.key}
          coursePar={coursePar}
          rule={i > 0}
          onPress={onRowPress ? () => onRowPress(row) : undefined}
        />
      ))}

      {total > MAX_ROWS || rows.length > MAX_ROWS ? (
        <FlatAction label={`All ${total}`} onPress={() => onOpenFull(active.key)} />
      ) : null}
    </AboutSection>
  );
};

export default BoardSection;
