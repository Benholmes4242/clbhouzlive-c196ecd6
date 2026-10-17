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
import { useTranslation } from 'react-i18next';
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
import { Button } from '@/components/ui/button';
import { ProjectionGhostRow, ghostInsertionIndex } from './ProjectionGhostRow';
import { MEDAL_GOLD } from '@/lib/tokens/medals';

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
  /** State 2: cabinet owns selection; no viewer rank or duplicated champion statement. */
  fieldOnly?: boolean;
  ghost?: { value: number; initials: string };
  projectedScreen?: boolean;
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
  fieldOnly = false,
  ghost,
  projectedScreen = false,
}) => {
  const { t } = useTranslation('courses');
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
  const rows = fieldOnly ? (entry?.rows ?? []).map(row => ({ ...row, isSelf: false })) : entry?.rows ?? [];
  if (rows.length === 0 && !fieldOnly) return null;

  const positions = positionsFor(rows);
  const shown = rows.slice(0, MAX_ROWS);
  const total = entry?.total ?? rows.length;
  const viewerValue = rows.find((r) => r.isSelf)?.value ?? null;
  const ghostIndex = ghost ? ghostInsertionIndex(rows, ghost.value) : -1;

  return (
    <AboutSection heading={active.label} meta={windowMeta(total, legendWindow, t)} space={30}>
      {canSwitchWindow || fieldOnly ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 12, fontFamily: SANS }}>
          {(['all_time', '90d'] as LegendWindow[]).map((w) => {
            const on = w === legendWindow;
            return (
              <Button variant="ghost"
                key={w}
                type="button"
                onClick={() => onWindowChange(w)}
                aria-pressed={on}
                style={{
                  // Deliberately BELOW the chips in visual weight: the chips
                  // choose what you look at, this only narrows when. Smaller,
                  // lighter, muted — never a second row of equals.
                  padding: 0,
                  height: 'auto',
                  border: 0,
                  background: 'transparent',
                  fontFamily: SANS,
                  fontSize: 10.5,
                  fontWeight: on ? 600 : 500,
                  color: on ? A.MUTE : A.DIM,
                  cursor: 'pointer',
                }}
              >
                {w === 'all_time' ? 'All time' : '90 days'}
              </Button>
            );
          })}
        </div>
      ) : null}

      {!fieldOnly && chips.length > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <BoardChips chips={chips} activeKey={active.key} onSelect={onSelectCategory} />
        </div>
      ) : null}

      {!fieldOnly && <ChampionLine category={active.key} rows={rows} viewerValue={viewerValue} />}
      {rows.length > 0 && <AboutHairline style={{ marginTop: 12 }} />}
      {fieldOnly && rows.length === 0 && <div style={{ color: A.DIM }}>Never claimed</div>}

      {shown.map((row, i) => <React.Fragment key={`${row.userId ?? row.name}-${positions[i]}`}>
        {ghost && ghostIndex === i && <ProjectionGhostRow {...ghost} leader={rows[0]?.value ?? null} />}
        <FlatBoardRow
          row={row}
          pos={positions[i]}
          recordTone={projectedScreen ? MEDAL_GOLD : undefined}
          category={active.key}
          coursePar={coursePar}
          rule={i > 0}
          onPress={onRowPress && row.username ? () => onRowPress(row) : undefined}
        />
      </React.Fragment>)}
      {ghost && ghostIndex >= shown.length && <ProjectionGhostRow {...ghost} leader={rows[0]?.value ?? null} />}

      {rows.length > 0 && (fieldOnly || total > MAX_ROWS || rows.length > MAX_ROWS) ? (
        <FlatAction label={`All ${total}`} onPress={() => onOpenFull(active.key)} />
      ) : null}
      {ghost && <div className="champions-empty-said" style={{ color: A.MUTE }}>The dashed row is <b>a projection, not a score</b>, so it carries no rank and nobody below it is renumbered. It moves with your handicap and disappears the moment you post a card here.</div>}
    </AboutSection>
  );
};

export default BoardSection;
