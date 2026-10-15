import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { courseRankLabels, RANK_LIST_BY_SLUG, RANK_LIST_LABEL } from '@/features/courses/_shared/courseRankLabels';

import { SectionHead, HEAD_GAP, SECTION_WRAP } from '@/components/courses/browse/SectionHead';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import {
  getCurrentMilestoneMeta,
  getMilestoneMetaByThreshold,
  getNextMilestone,
  MILESTONE_TIER_META,
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

type CellState = 'reviewed' | 'played' | 'member' | 'nobody';

/* A square is YOURS when user_course_activity has it — a tracked round OR a
   rating — because that is what the figure above the grid counts, and the two
   must never disagree. Check in plain words: solid plus ring always equals
   viewerPlayed. Solid = yours and reviewed; ring = yours, not yet reviewed.
   The community side still reads roundsTracked: grey means a member has a
   round here. */
function cellState(e: Top100Enrichment | undefined): CellState {
  const played = e?.yourActivity === true;
  if (played && e?.ratedByYou) return 'reviewed';
  if (played) return 'played';
  if ((e?.roundsTracked ?? 0) > 0) return 'member';
  return 'nobody';
}

function cellStyle(state: CellState): React.CSSProperties {
  switch (state) {
    case 'reviewed': return { background: A.AMBER };
    case 'played': return { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${A.AMBER}` };
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
        <span style={{ color: A.AMBER, fontWeight: 700 }}>You played</span>
        {best}
        {rating ? <> · Reviewed <span style={STRONG}>{rating}</span></> : null}
      </>
    );
  }
  if (played) {
    return (
      <>
        <span style={{ color: A.AMBER, fontWeight: 700 }}>You played</span>
        {best}
        <span style={{ color: A.DIM }}> · Not yet reviewed</span>
      </>
    );
  }
  if (reviewed) {
    return (
      <>
        <span style={{ color: A.AMBER, fontWeight: 700 }}>You reviewed{rating ? <> <span style={STRONG}>{rating}</span></> : null}</span>
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
  const current = getCurrentMilestoneMeta(viewerPlayed);
  const nextThreshold = getNextMilestone(viewerPlayed);
  const next = nextThreshold != null ? getMilestoneMetaByThreshold(nextThreshold) : undefined;
  const cells = courseIds.slice(0, total);
  const listLabel = RANK_LIST_LABEL[RANK_LIST_BY_SLUG[listSlug]] ?? '';

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
        {/* The club is scoped to ONE list and says so. A list holds 100 courses, so the ladder stops at 100 — do not reintroduce 200/300/400 here. The list name is resolved from RANK_LIST_LABEL, which is the one home for these four names. */}
        {viewerPlayed > 0 ? (
          <div style={{ textAlign: 'right' }}>
            {current ? (
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: MEDAL_GOLD }}>
                {`${listLabel} ${current.tierName}`}
              </div>
            ) : null}
            {current && next && nextThreshold != null ? (
              <div style={{ fontSize: 11.5, color: A.DIM, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {`${nextThreshold - viewerPlayed} more to the ${next.tierName}`}
              </div>
            ) : null}
            {!current ? (
              <div style={{ fontSize: 11.5, color: A.DIM, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {`${MILESTONE_TIER_META[0].threshold - viewerPlayed} more to the ${listLabel} ${MILESTONE_TIER_META[0].tierName}`}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(10, 1fr)', gap: 4, height: 320 }}>
        {cells.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected((cur) => (cur === id ? null : id))}
            aria-label={`#${i + 1} ${subjects.get(id)?.name ?? ''}`.trim()}
            aria-pressed={selected === id}
            /*
             * The cells are deliberately wider than they are tall. The width is set by the
             * ten columns; the height is the only free variable in this grid. At ten columns
             * across a 361px run the cell is 32.5px wide, so a square cell made the grid
             * 361px tall — the height was the width, not a choice. The grid now carries an
             * explicit 320px height and ten 1fr rows, so each cell is 28.4px tall — the height
             * is declared once on the container instead of guessed per cell, and the full tap
             * width is kept.
             */
            style={{
              borderRadius: 3, padding: 0, border: 0, cursor: 'pointer',
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

      <div style={{ marginTop: 12, minHeight: 52, display: 'flex', alignItems: 'center' }}>
        {selected ? (
          <PeekRow id={selected} subject={subjects.get(selected)} e={enrichment.get(selected)} onOpen={() => onOpenCourse(selected)} />
        ) : (
      <div data-testid="hundred-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
        {LEGEND.map(({ state, label }) => (
          <span key={state} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: A.DIM }}>
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: 2, ...cellStyle(state) }} />
            {label}
          </span>
        ))}
      </div>
        )}
      </div>
    </section>
  );
}
