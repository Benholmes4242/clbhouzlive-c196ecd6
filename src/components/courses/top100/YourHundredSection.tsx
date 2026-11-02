import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { courseRankLabels, RANK_LIST_BY_SLUG, RANK_LIST_LABEL } from '@/features/courses/_shared/courseRankLabels';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';

/**
 * YourHundredSection — BRIEF_TOP_100_REBUILD §2.
 *
 * VIEWER figures only. `viewerPlayed` / `total` come from the per-list row of
 * user_top100_progress_view for the ACTIVE scope (never the global total, never
 * a typed 100). T100 removes tiers; milestone helpers remain in their module.
 *
 * The grid is drawn at the LOADED length (capped at the list total): padding
 * unloaded slots with "nobody yet" cells would assert something false.
 */

/* The two neutral cell fills are the brief's own values and have no owner in
   the token modules yet. Declared once here; flagged in the report. */
const CELL_MEMBER = 'var(--t100-member)';
const CELL_NOBODY = 'var(--t100-nobody)';

/* Grid geometry, read by the section AND its shell (BRIEF_COURSES_SKELETONS 3.1,
   BRIEF_YOUR_HUNDRED_1 / HUNDRED_FIT_1). Twelve columns at a 3px gap; the row
   count and the reserved height are functions of the list total, so the section
   and its skeleton can never disagree. */
export const HUNDRED_COLS = 12;
export const HUNDRED_GAP = 3;
export const HUNDRED_CELL_H = 22;
export const HUNDRED_CELL_RADIUS = 3;
export const HUNDRED_GRID_TOP = 14;
export const hundredRows = (total: number) => Math.ceil(total / HUNDRED_COLS);
export const hundredGridHeight = (total: number) => {
  const rows = hundredRows(total);
  return rows * HUNDRED_CELL_H + (rows - 1) * HUNDRED_GAP;
};
/* Figure and legend slot geometry (3.2). */
export const HUNDRED_FIGURE = { size: 34, lineHeight: 0.85 } as const;
export const HUNDRED_LEGEND = { marginTop: 12, minHeight: 40, swatch: 9, swatchRadius: 2, rowGap: 6, colGap: 14, labelGap: 6, labelSize: 10.5 } as const;

export type CellState = 'reviewed' | 'played' | 'member' | 'nobody';

/* A square is YOURS when user_course_activity has it — a tracked round OR a
   rating — because that is what the figure above the grid counts, and the two
   must never disagree. Check in plain words: solid plus ring always equals
   viewerPlayed. Solid = yours and reviewed; ring = yours, not yet reviewed.
   The community side still reads roundsTracked: grey means a member has a
   round here. */
export function cellState(e: Top100Enrichment | undefined): CellState {
  const played = e?.yourActivity === true;
  if (played && e?.ratedByYou) return 'reviewed';
  if (played) return 'played';
  if ((e?.roundsTracked ?? 0) > 0) return 'member';
  return 'nobody';
}

export function cellStyle(state: CellState): React.CSSProperties {
  switch (state) {
    case 'reviewed': return { background: A.INK };
    case 'played': return { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${A.INK}` };
    case 'member': return { background: CELL_MEMBER };
    default: return { background: CELL_NOBODY };
  }
}

const LEGEND: Array<{ state: CellState; label: string }> = [
  { state: 'reviewed', label: 'Played and reviewed' },
  { state: 'played', label: 'Played, not reviewed' },
  { state: 'member', label: 'A member played' },
  { state: 'nobody', label: 'Nobody yet' },
];

interface Props {
  /** Raw database list slug, e.g. 'gb-i'. */
  listSlug: string;
  viewerPlayed: number;
  total: number;
  /** Rank-ordered ids for the active list (cell one = rank one). */
  courseIds: string[];
  enrichment: Map<string, Top100Enrichment>;
  subjects: Map<string, YourHundredSubject>;
  onOpenCourse: (courseId: string) => void;
}

export interface YourHundredSubject {
  name: string;
  imageUrl: string | null;
  memberships: Array<{ list_slug: string; rank: number }>;
}

const STRONG: React.CSSProperties = { color: A.BODY, fontWeight: 700, fontVariantNumeric: 'tabular-nums' };

function StatusLine({ e }: { e: Top100Enrichment | undefined }) {
  const played = e?.yourActivity === true;
  const reviewed = !!e?.ratedByYou;
  const n = e?.playerCount ?? 0;
  const rating = e?.yourRating != null ? e.yourRating.toFixed(1) : null;
  // Best is printed only when there is a round to print.
  const best = (e?.yourRounds ?? 0) > 0 && e?.yourBest != null ? <> · Best <span style={STRONG}>{e.yourBest}</span></> : null;
  if (played && reviewed) {
    return (
      <>
        <span style={{ color: A.INK, fontWeight: 700 }}>You played</span>
        {best}
        {rating ? <> · Reviewed <span style={STRONG}>{rating}</span></> : null}
      </>
    );
  }
  if (played) {
    return (
      <>
        <span style={{ color: A.INK, fontWeight: 700 }}>You played</span>
        {best}
        <span style={{ color: A.DIM }}> · Not yet reviewed</span>
      </>
    );
  }
  if (reviewed) {
    return (
      <>
        <span style={{ color: A.INK, fontWeight: 700 }}>You reviewed{rating ? <> <span style={STRONG}>{rating}</span></> : null}</span>
        {n > 0 ? <> · <span style={STRONG}>{n}</span> members</> : null}
      </>
    );
  }
  if (n > 0) {
    return (
      <>
        <span style={STRONG}>{n}</span> members
        {e?.recordGross != null && e?.recordHolder ? <> · Best <span style={STRONG}>{e.recordGross}</span></> : null}
      </>
    );
  }
  return <span style={{ color: A.FAINT }}>No member has logged an official round yet.</span>;
}

function PeekRow({ id, subject, e, onOpen }: { id: string; subject: YourHundredSubject | undefined; e: Top100Enrichment | undefined; onOpen: () => void }) {
  const ranks = courseRankLabels(
    (subject?.memberships ?? [])
      .filter((m) => m.list_slug in RANK_LIST_BY_SLUG && m.rank != null)
      .map((m) => ({ list: RANK_LIST_BY_SLUG[m.list_slug], rank: Number(m.rank) })),
  ).join(' · ');
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', minWidth: 0, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flex: 'none' }}>
        <CourseImageFallback courseId={id} courseName={subject?.name ?? ''} imageUrl={subject?.imageUrl ?? null} style={{ height: '100%' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subject?.name ?? ''}
        </div>
        {ranks ? (
          <div data-testid="peek-ranks" style={{ marginTop: 3, fontSize: 11, fontWeight: 700, color: A.BODY, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{ranks}</div>
        ) : null}
        <div style={{ marginTop: 2, fontSize: 11, color: A.DIM, whiteSpace: 'nowrap' }}>
          <StatusLine e={e} />
        </div>
      </div>
      <ChevronRight size={16} color={A.DIM} style={{ flex: 'none', paddingLeft: 4 }} />
    </button>
  );
}

export function YourHundredSection({ listSlug, viewerPlayed, total, courseIds, enrichment, subjects, onOpenCourse }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  // A new region is a different hundred: drop the selection.
  useEffect(() => { setSelected(null); }, [courseIds]);
  const cells = courseIds.slice(0, total);

  return (
    <div data-your-hundred-grid>
      <div style={{ marginTop: HUNDRED_GRID_TOP, display: 'grid', gridTemplateColumns: `repeat(${HUNDRED_COLS}, 1fr)`, gridTemplateRows: `repeat(${hundredRows(total)}, ${HUNDRED_CELL_H}px)`, gap: HUNDRED_GAP }}>
        {cells.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected((cur) => (cur === id ? null : id))}
            aria-label={`#${i + 1} ${subjects.get(id)?.name ?? ''}`.trim()}
            aria-pressed={selected === id}
            /*
             * The cells are deliberately wider than they are tall. The width falls out of
             * the twelve columns (27px across a 357px run); the height is declared once on
             * the container as an explicit 22px row track, so the full tap width is kept
             * and the grid clears the fold (HUNDRED_FIT_1).
             */
            style={{
              borderRadius: HUNDRED_CELL_RADIUS, padding: 0, border: 0, cursor: 'pointer',
              ...(() => {
                const base = cellStyle(cellState(enrichment.get(id)));
                if (selected !== id) return base;
                const ring = `0 0 0 2px ${A.CANVAS}, 0 0 0 4px ${A.INK}`;
                return { ...base, boxShadow: base.boxShadow ? `${base.boxShadow}, ${ring}` : ring };
              })(),
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: HUNDRED_LEGEND.marginTop, minHeight: HUNDRED_LEGEND.minHeight, display: 'flex', alignItems: 'center' }}>
        {selected ? (
          <PeekRow id={selected} subject={subjects.get(selected)} e={enrichment.get(selected)} onOpen={() => onOpenCourse(selected)} />
        ) : (
      <div data-testid="hundred-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: `${HUNDRED_LEGEND.rowGap}px ${HUNDRED_LEGEND.colGap}px` }}>
        {LEGEND.map(({ state, label }) => (
          <span key={state} style={{ display: 'inline-flex', alignItems: 'center', gap: HUNDRED_LEGEND.labelGap, fontSize: HUNDRED_LEGEND.labelSize, color: A.DIM }}>
            <span aria-hidden style={{ width: HUNDRED_LEGEND.swatch, height: HUNDRED_LEGEND.swatch, borderRadius: HUNDRED_LEGEND.swatchRadius, ...cellStyle(state) }} />
            {label}
          </span>
        ))}
      </div>
        )}
      </div>
    </div>
  );
}

/** The active activity-progress row controls visibility; the reviewed caption
 * counts reviewed cells, not a separate server-rated aggregate. List-keyed by
 * the panel: every visit and every scope change starts closed. */
export function YourCoursesDropdown(props: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [props.listSlug]);
  if (props.viewerPlayed < 5) return null;
  const cells = props.courseIds.slice(0, props.total).map(id => cellState(props.enrichment.get(id)));
  const reviewed = cells.filter(state => state === 'reviewed').length;
  return <div className="t100-dropdown" data-your-courses>
    <Button variant="ghost" className="t100-dropdown-header" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <span className="t100-mini" aria-hidden>{cells.map((state, i) => <i key={i} data-state={state} />)}</span>
      <span className="t100-dropdown-copy"><b>Your courses</b><span className="tabular-nums">{props.viewerPlayed} played · {reviewed} reviewed</span></span>
      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </Button>
    {open ? <div className="t100-dropdown-body"><YourHundredSection {...props} /></div> : null}
  </div>;
}
