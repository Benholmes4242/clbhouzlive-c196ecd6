import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
/**
 * TOP 100 LEADERBOARD — "Who's played the most" card and sheet (Option B,
 * signed off). Replaces the Your Hundred row on this page only: the old
 * components stay in the codebase, this page stops mounting them.
 *
 * The board is useCareerBoard with the list's TOP100_METRIC; p_viewer null
 * returns the public board, so guests and members share one read. The gate's
 * 'race' readiness is reported here, for members and guests alike.
 *
 * Tab switching keeps the last settled tab's summary and rows on screen at
 * opacity .4 while the new tab's board is placeholder data, so there is no
 * height jump and no wrong list label; the swap is one paint.
 * The list-neutral page card also retains its last settled board during page
 * chip switches; errors and settled empty boards still suppress it.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ordinal } from '@/lib/text/numbers';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { useCareerBoard, TOP100_METRIC, type CareerRow } from '@/hooks/top100/useTop100Race';
import { useTop100ListProgress } from '@/hooks/gam/useTop100ListProgress';
import { RANK_SCOPE_LABEL, type RankListSlug } from '@/features/explore-magazine/useTop100RankIndex';
import { Top100ListProgressSheet } from '@/components/top100/sheets/Top100ListProgressSheet';
import { settled, useSectionReady } from '../browse/PageLoadGate';
import './top100Compare.css';

const LISTS: RankListSlug[] = ['global', 'gb-i', 'europe', 'usa'];

/** The viewer's row: the server flags it, the id matches as a fallback. */
function viewerRow(rows: CareerRow[], viewerId: string | undefined): CareerRow | undefined {
  return rows.find(r => r.is_viewer || (viewerId != null && r.user_id === viewerId));
}
const posText = (r: CareerRow) => `${r.is_tie ? '=' : ''}${ordinal(r.pos)}`;

/** Card sub line. n = rows.length; numbers and ordinals are <em>. */
function cardSub(rows: CareerRow[], viewerId: string | undefined) {
  const n = rows.length, leader = rows[0], me = viewerRow(rows, viewerId);
  if (!viewerId) return <><InlineProMemberName userId={leader.user_id}>{leader.display_name}</InlineProMemberName> leads on <em>{leader.value}</em>. {n} {n === 1 ? 'member has' : 'members have'} played one.</>;
  if (me) {
    if (me.pos === 1 && !me.is_tie) {
      const second = rows[1];
      return second
        ? <>You lead on <em>{me.value}</em>, <em>{me.value - second.value}</em> ahead of <InlineProMemberName userId={second.user_id}>{second.display_name}</InlineProMemberName>.</>
        : <>You lead on <em>{me.value}</em>.</>;
    }
    if (me.pos === 1) return <>You share the lead on <em>{me.value}</em>.</>;
    return <><InlineProMemberName userId={leader.user_id}>{leader.display_name}</InlineProMemberName> leads on <em>{leader.value}</em>. You're <em>{posText(me)}</em> of {n}.</>;
  }
  return <><InlineProMemberName userId={leader.user_id}>{leader.display_name}</InlineProMemberName> leads on <em>{leader.value}</em>. You haven't played one yet.</>;
}

/** Sheet summary sentence. Figures and the leader's name are <b>. */
function summary(rows: CareerRow[], viewerId: string | undefined, lab: string) {
  const n = rows.length, leader = rows[0], me = viewerRow(rows, viewerId);
  if (!viewerId) return <><b><InlineProMemberName userId={leader.user_id}>{leader.display_name}</InlineProMemberName></b> leads the {lab} Top 100 on <b>{leader.value}</b>. {n} {n === 1 ? 'member has' : 'members have'} played at least one.</>;
  if (!me) return <>You haven't played any of the {lab} Top 100 yet. <b><InlineProMemberName userId={leader.user_id}>{leader.display_name}</InlineProMemberName></b> leads on <b>{leader.value}</b>.</>;
  if (me.pos === 1 && me.is_tie) return <>You share the lead on the {lab} Top 100 on <b>{me.value}</b>.</>;
  if (me.pos === 1) {
    const second = rows[1];
    return <>You lead the {lab} Top 100 on <b>{me.value}</b>{second ? <>, <b>{me.value - second.value}</b> ahead of <InlineProMemberName userId={second.user_id}>{second.display_name}</InlineProMemberName></> : null}.</>;
  }
  return <>You've played <b>{me.value}</b> of the {lab} Top 100. <b>{posText(me)}</b> of {n}, <b>{leader.value - me.value}</b> behind <InlineProMemberName userId={leader.user_id}>{leader.display_name}</InlineProMemberName>.</>;
}

function Sheet({ viewerId, pageList, pageListSize, onClose }: { viewerId: string | undefined; pageList: RankListSlug; pageListSize: number | undefined; onClose: () => void }) {
  const [tab, setTab] = useState<RankListSlug>(pageList);
  const board = useCareerBoard(viewerId, TOP100_METRIC[tab], 100);
  const progress = useTop100ListProgress(tab, viewerId, viewerId);
  const [member, setMember] = useState<{ row: CareerRow; list: RankListSlug } | null>(null);
  const size = tab === pageList ? (pageListSize ?? 100) : (progress.data?.length ?? 100);
  /* While a new tab's board is placeholder data, keep the last settled tab on screen. */
  const settledRef = useRef<{ tab: RankListSlug; rows: CareerRow[]; size: number } | null>(null);
  useEffect(() => {
    if (!board.isPlaceholderData && board.data) settledRef.current = { tab, rows: board.data, size };
  });
  const shown = board.isPlaceholderData && settledRef.current ? settledRef.current : { tab, rows: board.data ?? [], size };
  const dimmed = shown.tab !== tab;
  const rows = shown.rows, leader = rows[0], me = viewerRow(rows, viewerId);
  const lab = RANK_SCOPE_LABEL[shown.tab];
  const tickPct = leader ? Math.min(100, (leader.value / shown.size) * 100) : 0;
  return <>
    <BottomSheet open onClose={onClose} scrollBody ariaLabelledBy="t100b-lb-title">
      <div className="t100b"><div className="t100b-sheet">
        <div className="t100b-kicker">TOP 100 LEADERBOARD</div>
        <div id="t100b-lb-title" className="t100b-title">Who's played the most</div>
        <div className="t100b-lb-tabs">{LISTS.map(l => <button type="button" key={l} className="t100b-lb-tab" aria-pressed={tab === l} onClick={() => setTab(l)}>{RANK_SCOPE_LABEL[l]}</button>)}</div>
        <div style={dimmed ? { opacity: 0.4 } : undefined}>
          <div className="t100b-lb-sum">
            <div className="t100b-lb-sumt">{rows.length > 0 ? summary(rows, viewerId, lab) : null}</div>
            {viewerId && leader ? <>
              <div className="t100b-lb-bar">
                <span className="t100b-lb-fill" style={{ width: `${Math.min(100, ((me?.value ?? 0) / shown.size) * 100)}%` }} />
                <span className="t100b-lb-tick" style={{ left: `${tickPct}%` }} />
              </div>
              <div className="t100b-lb-labels">
                {tickPct < 18 ? null : <span style={{ left: 0 }}>0</span>}
                {tickPct < 18
                  ? <span style={{ left: 0 }}>LEADER {leader.value}</span>
                  : tickPct > 82
                    ? <span style={{ right: 0 }}>LEADER {leader.value}</span>
                    : <span style={{ left: `${tickPct}%`, transform: 'translateX(-50%)' }}>LEADER {leader.value}</span>}
                {tickPct > 82 ? null : <span style={{ right: 0 }}>{shown.size}</span>}
              </div>
            </> : null}
          </div>
          <div className="t100b-lb-rows">{rows.map(r => {
            const you = Boolean(r.is_viewer || (viewerId != null && r.user_id === viewerId));
            return <button type="button" key={r.user_id} className={you ? 't100b-lb-row you' : 't100b-lb-row'} onClick={() => setMember({ row: r, list: shown.tab })}>
              <span className="t100b-lb-pos">{r.is_tie ? '=' : ''}{r.pos}</span>
              <SquircleAvatar src={r.photo_url} alt={r.display_name ?? ''} size={40} hideRing />
              <span className="t100b-lb-rt">
                <span className="t100b-lb-rn"><InlineProMemberName userId={r.user_id}>{you ? 'You' : r.display_name}</InlineProMemberName></span>
                {r.last_course_name ? <span className="t100b-lb-rs">{shortCourseName(r.last_course_name)}</span> : null}
              </span>
              <span className="t100b-lb-rv">{r.value}</span>
            </button>;
          })}</div>
          {viewerId && me ? <button type="button" className="t100b-lb-yc" onClick={() => setMember({ row: me, list: shown.tab })}>
            <span>Your <b>{me.value}</b> {lab} Top 100 courses</span><ChevronRight size={14} aria-hidden />
          </button> : null}
        </div>
      </div></div>
    </BottomSheet>
    {member ? <Top100ListProgressSheet open onClose={() => setMember(null)} listSlug={member.list} ownerUserId={member.row.user_id} ownerName={member.row.display_name || 'A member'} ownerPhotoUrl={member.row.photo_url} standing={{ place: member.row.pos, fieldSize: Number(member.row.total_members) }} /> : null}
  </>;
}

export function Top100Leaderboard({ viewerId, list, listSize }: { viewerId: string | undefined; list: RankListSlug; listSize: number | undefined }) {
  const board = useCareerBoard(viewerId, TOP100_METRIC[list], 100);
  useSectionReady('race', settled(board));
  const [open, setOpen] = useState(false);
  const settledRows = useRef<CareerRow[]>([]);
  useEffect(() => {
    if (!board.isPlaceholderData && !board.isError && settled(board)) {
      settledRows.current = board.data ?? [];
    }
  }, [board.data, board.isPlaceholderData, board.isError, board.isFetched, board.status]);
  if (board.isError) return null;
  const rows = board.isPlaceholderData ? settledRows.current : board.data ?? [];
  if (rows.length === 0) return null;
  return (
    <section className="t100b-section">
      <div className="t100b-kicker">TOP 100 LEADERBOARD</div>
      <button type="button" className="t100b-lb-card" onClick={() => setOpen(true)}>
        <span className="t100b-lb-stack">{rows.slice(0, 3).map((r, i) => (
          <span className="t100b-lb-av" key={r.user_id} style={i === 0 ? { marginLeft: 0 } : undefined}><SquircleAvatar src={r.photo_url} alt={r.display_name ?? ''} size={34} hideRing /></span>
        ))}</span>
        <span className="t100b-lb-copy"><b>Who's played the most</b><span>{cardSub(rows, viewerId)}</span></span>
        <ChevronRight size={16} className="t100b-lb-chev" aria-hidden />
      </button>
      {open ? <Sheet viewerId={viewerId} pageList={list} pageListSize={listSize} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
