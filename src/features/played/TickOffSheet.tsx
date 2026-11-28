/** Brief 50 Part C2 — "Tick off courses": a searchable checklist of a whole
 * Top 100 list. Rows read get_top100_list_progress (rank/name/county) and the
 * member's state from usePlayedCourses; taps use the optimistic tick with no
 * per-row toast. Footer counts are live from the same lookup. */
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { RailChips } from '@/components/ui/RailChips';
import { useTop100ListProgress } from '@/hooks/gam/useTop100ListProgress';
import { usePlayedCourses } from '@/hooks/played/usePlayedCourses';
import { useSetCoursePlayed } from '@/hooks/played/useSetCoursePlayed';
import { formatRating, isPlayed, isRated, lockedReason } from '@/hooks/played/playedRules';
import { CheckIcon } from './PlayedIcons';
import './played.css';

export const TICK_LISTS = [
  { id: 'global', label: 'Global' },
  { id: 'gb-i', label: 'GB&I' },
  { id: 'europe', label: 'Europe' },
  { id: 'usa', label: 'USA' },
] as const;
export const listShortLabel = (slug: string) => TICK_LISTS.find(l => l.id === slug)?.label ?? slug;

export function TickOffSheet({ open, onClose, initialList }: { open: boolean; onClose: () => void; initialList: string }) {
  const [list, setList] = useState(initialList);
  const [q, setQ] = useState('');
  const played = usePlayedCourses();
  const { toggle } = useSetCoursePlayed();
  const rows = useTop100ListProgress(list, played.userId, played.userId);
  const all = useMemo(() => [...(rows.data ?? [])].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)), [rows.data]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? all.filter(r => (r.course_name ?? '').toLowerCase().includes(term)) : all;
  }, [all, q]);
  let playedCount = 0, ratedCount = 0;
  for (const r of all) {
    const e = played.get(r.course_id);
    if (isPlayed(e)) playedCount += 1;
    if (isRated(e)) ratedCount += 1;
  }
  const label = listShortLabel(list);
  return (
    <BottomSheet open={open} onClose={onClose} scrollBody topRadius={26} maxHeight="88dvh" ariaLabelledBy="pl-tick-title">
      <div className="pl-sheet" data-tick-sheet style={{ background: 'transparent', minHeight: '70dvh' }}>
        <div className="pl-eb">TICK OFF COURSES</div>
        <div id="pl-tick-title" className="pl-sh-ti">Which have you played?</div>
        <p className="pl-sh-sub">One tap each. You can rate them whenever you like: played courses wait for you on the Top 100 page.</p>
        <div style={{ marginTop: 12 }}>
          <RailChips options={TICK_LISTS as never} value={list} onChange={(v: string) => { setList(v); }} ariaLabel="Top 100 list" size="sm" align="center-when-fit" />
        </div>
        <label className="pl-search">
          <Search size={15} aria-hidden style={{ color: 'rgba(248,250,252,.45)', flex: 'none' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search the ${label} 100`} aria-label={`Search the ${label} 100`} />
        </label>
        <div className="pl-blist" role="list">
          {shown.map(r => {
            const e = played.get(r.course_id);
            const on = isPlayed(e);
            const locked = lockedReason(e);
            const name = r.course_name ?? '';
            return (
              <button type="button" role="listitem" key={r.course_id} className="pl-br" data-course-id={r.course_id}
                aria-label={on ? `${name} played` : `Mark ${name} as played`} aria-pressed={on}
                onClick={() => toggle(e, r.course_id, name, 'tick_sheet', { quiet: true })}>
                <span className="pl-brk">{r.rank ?? ''}</span>
                <span className="pl-brn"><b>{name}</b><small>{r.region ?? r.country ?? ''}</small></span>
                {locked && e?.via_rating ? <span className="pl-lockd"><b>{formatRating(e.rating)}</b><small>RATED</small></span>
                  : locked ? <span className="pl-lockd"><b>{e?.rounds ?? 0}</b><small>ROUNDS</small></span>
                  : <span className="pl-cb" data-on={on}><CheckIcon size={14} /></span>}
              </button>
            );
          })}
        </div>
        <div className="pl-foot" data-tick-foot>
          <span><b>{playedCount}</b> of {all.length} played · <b>{ratedCount}</b> rated</span>
          <button type="button" className="pl-solid" onClick={onClose}>Done</button>
        </div>
      </div>
    </BottomSheet>
  );
}
