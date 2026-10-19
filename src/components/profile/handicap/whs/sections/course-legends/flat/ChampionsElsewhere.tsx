/** CHAMPIONS_ELSEWHERE_R: connected members only, across courses they have
 * already played (the source returns a rank, so every row is a real standing).
 * No projection onto unplayed courses. No rank, field size or leader name:
 * the source does not carry the frame that would make them complete.
 * The heading count is the rendered card count by construction.
 */
import React from 'react';
import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
import type { LegendCategory } from '@/lib/gam/types';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { numberWord } from '@/lib/text/numbers';
import { useTitlesInReach, type TitleInReach } from '@/hooks/gam/useTitlesInReach';
import { CHAMPIONS_BOARD_DATA, championsBoardName } from '../_shared/championsOrder';
import './championsEmpty.css';

export interface ElsewhereCard { row: TitleInReach; category: LegendCategory; proportion: number }

/** VC4: member against leader, direction-aware, clamped to 0..1. */
export function reachProportion(category: LegendCategory, user: number, leader: number): number {
  const data = CHAMPIONS_BOARD_DATA[category];
  const higherWins = data.kind === 'cumulative' || data.kind === 'not-projectable';
  const ratio = higherWins ? (leader > 0 ? user / leader : 0) : (user > 0 ? leader / user : 0);
  return Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
}

/** VC5: ordered by bar proportion, not raw gap. Unknown categories and boards
 * already held (nothing to beat) are not cards. */
export function elsewhereCards(rows: readonly TitleInReach[]): ElsewhereCard[] {
  return rows
    .filter(row => {
      // XA4: an unrecognised category is dropped, but never silently.
      if (!(row.category in CHAMPIONS_BOARD_DATA)) { console.warn('[champions] elsewhere: unrecognised category', row.category); return false; }
      return Number(row.gap) > 0;
    })
    .map(row => {
      const category = row.category as LegendCategory;
      return { row, category, proportion: reachProportion(category, Number(row.user_value), Number(row.leader_value)) };
    })
    .sort((a, b) => b.proportion - a.proportion);
}

export function ElsewhereSection({ rows }: { rows: readonly TitleInReach[] }) {
  const cards = elsewhereCards(rows);
  if (!cards.length) return null;
  return <section className="champions-empty-section" data-section="elsewhere" style={{ color: A.INK }}>
    <div className="champions-empty-kicker" style={VERDICT_KICKER}>Elsewhere</div>
    <h2 data-card-count={cards.length} style={TAB_TITLE}>{numberWord(cards.length)} {cards.length === 1 ? 'board you are' : 'boards you are'} closest to</h2>
    <div className="champions-empty-lede" style={{ color: A.MUTE }}>Across every course you have played. Ordered by how little stands between you and the top.</div>
    {cards.map(({ row, category, proportion }) => <div key={`${row.course_id}-${row.category}`} data-elsewhere-card="" data-proportion={proportion} style={{ background: A.PANEL, borderRadius: 13, padding: 13, marginTop: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: A.INK }}>{row.course_name}</div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: A.AMBER }}>{championsBoardName(category)}</div>
      </div>
      <div style={{ fontSize: 11, color: A.DIM, fontVariantNumeric: 'tabular-nums', marginTop: 3 }}>You {row.user_value} · {row.leader_value} to beat</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 54px', alignItems: 'center', gap: 8, marginTop: 9 }}>
        <div style={{ height: 8, borderRadius: 4, background: `color-mix(in srgb, ${A.INK} 5%, transparent)`, overflow: 'hidden' }}>
          <div data-bar-fill="" style={{ width: `${Math.round(proportion * 100)}%`, height: '100%', background: A.AMBER, borderRadius: 4 }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: A.AMBER, fontVariantNumeric: 'tabular-nums' }}>{Number(Number(row.gap).toFixed(1))} off</div>
      </div>
    </div>)}
    <div className="champions-empty-said" style={{ color: A.MUTE, borderColor: A.BASELINE }}>Only courses you have already played appear here, because a rank is the thing that makes a gap real. <b>Courses you have never played cannot be ranked</b> and are not guessed at.</div>
  </section>;
}

/** VB1-VB3: rendered only for connected members; absent when nothing qualifies. */
export function ChampionsElsewhere({ userId }: { userId: string }) {
  const { data } = useTitlesInReach(userId);
  return <ElsewhereSection rows={data ?? []} />;
}

/** VB1/VB2: the signed-in personal member with a synced handicap; never otherwise. */
export function showElsewhere(connected: boolean, userId: string | null | undefined, actorId: string | null | undefined): boolean {
  return connected && Boolean(userId) && userId === actorId;
}
