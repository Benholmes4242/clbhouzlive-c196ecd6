import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import { TextInput } from './CourseFormFields';
import { clubBaseName, clubKey } from '../lib/clubName';

/**
 * ADD_COURSE_CLUB_1 — the Club section of Add course (mock ac1-add-course-club.html,
 * panels A/B/C). State lives on the sheet's form (so drafts cover it); every
 * change goes through `patch`, which saves the draft. Auto-match only runs
 * until the admin touches the mode, and never with a fixedClub.
 */
export type ClubPick = { id: string; name: string; country?: string | null; sub_country?: string | null };
export interface ClubFormFields {
  name: string; country: string; sub_country: string;
  club_mode: 'new' | 'existing'; club_mode_touched: boolean;
  club_name: string; club_name_touched: boolean;
  club_pick: ClubPick | null; club_auto: boolean; club_query: string;
}

const wrap: React.CSSProperties = { overflowWrap: 'anywhere' };
const card = (selected: boolean): React.CSSProperties => ({
  width: '100%', border: `1px solid ${selected ? t.inkFaint : t.line}`, borderRadius: 14, padding: '13px 14px',
  background: selected ? t.neutralSoft : 'transparent', boxSizing: 'border-box', minWidth: 0,
});
const titleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: t.ink, ...wrap };
const lineStyle: React.CSSProperties = { fontSize: 12.5, color: t.inkMuted, lineHeight: 1.4, marginTop: 3, ...wrap };
const inputStyle: React.CSSProperties = { height: 46, fontSize: 15, marginTop: 10 };
const indent: React.CSSProperties = { marginLeft: 32 };

function Option({ selected, title, line, onSelect, children }: { selected: boolean; title: string; line: string | null; onSelect: () => void; children?: React.ReactNode }) {
  return (
    <div style={card(selected)}>
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect}
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'transparent', border: 'none', textAlign: 'left', width: '100%', padding: 0, cursor: 'pointer', minWidth: 0 }}>
        <span aria-hidden style={{ width: 20, height: 20, borderRadius: 999, flex: 'none', marginTop: 1, boxSizing: 'border-box', border: selected ? `6px solid ${t.ink}` : `2px solid ${t.inkFaint}` }} />
        <span style={{ minWidth: 0, flex: 1 }}>
          <div style={titleStyle}>{title}</div>
          {line ? <div style={lineStyle}>{line}</div> : null}
        </span>
      </button>
      {selected ? children : null}
    </div>
  );
}

export default function AddCourseClubSection({ form, patch, fixedClub }: {
  form: ClubFormFields;
  patch: (p: Partial<ClubFormFields>) => void;
  fixedClub?: { id: string; name: string };
}) {
  const [hits, setHits] = useState<ClubPick[]>([]);
  const [searching, setSearching] = useState(false);

  // Club name follows the course's base name until edited.
  useEffect(() => {
    if (fixedClub || form.club_name_touched) return;
    const base = clubBaseName(form.name);
    if (base !== form.club_name) patch({ club_name: base });
  }, [form.name, form.club_name_touched, fixedClub]); // eslint-disable-line

  // Auto-match (panel B).
  useEffect(() => {
    if (fixedClub || form.club_mode_touched) return;
    if (!form.name.trim() || !form.sub_country) return;
    const key = clubKey(clubBaseName(form.name));
    if (!key) return;
    let cancelled = false;
    const h = setTimeout(async () => {
      try {
        let q: any = supabase.from('golf_clubs').select('id, name, country, sub_country').eq('club_key', key).eq('sub_country', form.sub_country);
        if (form.country) q = q.eq('country', form.country);
        const { data, error } = await q.limit(1);
        if (cancelled || error) return;
        const hit = (data ?? [])[0] as ClubPick | undefined;
        if (hit) patch({ club_mode: 'existing', club_pick: hit, club_auto: true, club_query: hit.name });
        else if (form.club_auto) patch({ club_mode: 'new', club_pick: null, club_auto: false });
      } catch { /* ignored */ }
    }, 300);
    return () => { cancelled = true; clearTimeout(h); };
  }, [form.name, form.country, form.sub_country, form.club_mode_touched, fixedClub]); // eslint-disable-line

  // Club search (same as CourseClubControl: 250ms, min 2 chars).
  const term = form.club_query.trim();
  const searchOn = !fixedClub && form.club_mode === 'existing' && !form.club_auto;
  useEffect(() => {
    if (!searchOn || term.length < 2) { setHits([]); setSearching(false); return; }
    let cancelled = false;
    setSearching(true);
    const h = setTimeout(async () => {
      const { data } = await (supabase.rpc as any)('search_golf_clubs', { p_query: term, p_limit: 6 });
      if (cancelled) return;
      setHits((data ?? []) as ClubPick[]);
      setSearching(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(h); };
  }, [term, searchOn]);

  if (fixedClub) {
    return (
      <div data-club-fixed style={card(true)}>
        <div style={titleStyle}>{fixedClub.name}</div>
        <div style={lineStyle}>This course is added to the club that asked for it.</div>
      </div>
    );
  }

  const pick = form.club_pick;
  const rows: ClubPick[] = pick ? [pick, ...hits.filter((h) => h.id !== pick.id)] : hits;
  const existingLine = form.club_mode === 'existing' && form.club_auto && pick
    ? `${pick.name} is already on clbhouz, so this course joins it.`
    : "For a second course at a club, e.g. The Belfry's Brabazon.";

  return (
    <div role="radiogroup" aria-label="Club" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <Option selected={form.club_mode === 'new'} title="A new club"
        line={form.club_mode === 'new' ? 'Members pick the club as their home club. One club can have several courses.' : null}
        onSelect={() => patch({ club_mode: 'new', club_mode_touched: true })}>
        <div style={indent}>
          <TextInput aria-label="Club name" placeholder="Club name" value={form.club_name} style={inputStyle}
            onChange={(v) => patch({ club_name: v, club_name_touched: true })} />
        </div>
      </Option>
      <Option selected={form.club_mode === 'existing'} title="A club already on clbhouz" line={existingLine}
        onSelect={() => patch({ club_mode: 'existing', club_mode_touched: true })}>
        <div style={indent}>
          <TextInput aria-label="Search clubs" placeholder="Search clubs" value={form.club_query} style={inputStyle}
            onChange={(v) => patch({ club_query: v, club_pick: null, club_auto: false })} />
          {searching ? <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 8 }}>Searching…</div> : null}
          {rows.length > 0 ? (
            <div data-club-results style={{ marginTop: 8, border: `1px solid ${t.hairline}`, borderRadius: 12, overflow: 'hidden' }}>
              {rows.map((r, i) => {
                const picked = pick?.id === r.id;
                return (
                  <button key={r.id} type="button" data-club-result={r.id}
                    onClick={() => patch({ club_pick: r, club_auto: false })}
                    style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${t.hairline}`, background: picked ? t.neutralSoft : 'transparent', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, color: t.ink, flex: 1, minWidth: 0, ...wrap }}>{r.name}</span>
                    {picked
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: t.ok, flex: 'none' }}>✓ Selected</span>
                      : <span style={{ fontSize: 12.5, color: t.inkFaint, flex: 'none' }}>{r.sub_country || r.country || ''}</span>}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </Option>
    </div>
  );
}
