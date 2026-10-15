import React from 'react';

import { SectionHead, HEAD_GAP, SECTION_WRAP } from '@/components/courses/browse/SectionHead';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import {
  getCurrentMilestoneMeta,
  getMilestoneMetaByThreshold,
  getNextMilestone,
} from '@/config/achievements';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';

/**
 * YourHundredSection — BRIEF_TOP_100_REBUILD §2.
 *
 * VIEWER figures only. `viewerPlayed` / `total` come from the per-list row of
 * user_top100_progress_view for the ACTIVE scope (never the global total, never
 * a typed 100). Tiers come from MILESTONE_TIER_META — nothing typed here.
 *
 * The grid is drawn at the LOADED length (capped at the list total): padding
 * unloaded slots with "nobody yet" cells would assert something false.
 */

/* The two neutral cell fills are the brief's own values and have no owner in
   the token modules yet. Declared once here; flagged in the report. */
const CELL_MEMBER = 'rgba(255,255,255,0.14)';
const CELL_NOBODY = 'rgba(255,255,255,0.055)';

type CellState = 'played' | 'rated' | 'member' | 'nobody';

function cellState(e: Top100Enrichment | undefined): CellState {
  if ((e?.yourRounds ?? 0) > 0) return 'played';
  if (e?.ratedByYou) return 'rated';
  if ((e?.roundsTracked ?? 0) > 0) return 'member';
  return 'nobody';
}

function cellStyle(state: CellState): React.CSSProperties {
  switch (state) {
    case 'played': return { background: A.AMBER };
    case 'rated': return { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${A.AMBER}` };
    case 'member': return { background: CELL_MEMBER };
    default: return { background: CELL_NOBODY };
  }
}

const LEGEND: Array<{ state: CellState; label: string }> = [
  { state: 'played', label: 'You played' },
  { state: 'rated', label: 'You rated' },
  { state: 'member', label: 'A member played' },
  { state: 'nobody', label: 'Nobody yet' },
];

interface Props {
  viewerPlayed: number;
  total: number;
  /** Rank-ordered ids for the active list (cell one = rank one). */
  courseIds: string[];
  enrichment: Map<string, Top100Enrichment>;
  courseNames: Map<string, string>;
  onCellTap: (courseId: string) => void;
}

export function YourHundredSection({ viewerPlayed, total, courseIds, enrichment, courseNames, onCellTap }: Props) {
  const current = getCurrentMilestoneMeta(viewerPlayed);
  const nextThreshold = getNextMilestone(viewerPlayed);
  const next = nextThreshold != null ? getMilestoneMetaByThreshold(nextThreshold) : undefined;
  const cells = courseIds.slice(0, total);

  return (
    <section style={SECTION_WRAP}>
      <SectionHead kicker="Your hundred" title="A life in golf, one list" />
      <div style={{ marginTop: HEAD_GAP, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.85, color: A.INK, fontVariantNumeric: 'tabular-nums lining-nums' }}>
            {viewerPlayed}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: A.DIM, fontVariantNumeric: 'tabular-nums' }}>of {total}</span>
        </div>
        {current ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: MEDAL_GOLD }}>
              {current.shortLabel}
            </div>
            {next && nextThreshold != null ? (
              <div style={{ fontSize: 11.5, color: A.DIM, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {nextThreshold - viewerPlayed} more to {next.shortLabel}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {cells.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => onCellTap(id)}
            aria-label={`#${i + 1} ${courseNames.get(id) ?? ''}`.trim()}
            style={{ aspectRatio: '1', borderRadius: 3, padding: 0, border: 0, cursor: 'pointer', ...cellStyle(cellState(enrichment.get(id))) }}
          />
        ))}
      </div>

      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
        {LEGEND.map(({ state, label }) => (
          <span key={state} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: A.DIM }}>
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: 2, ...cellStyle(state) }} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
