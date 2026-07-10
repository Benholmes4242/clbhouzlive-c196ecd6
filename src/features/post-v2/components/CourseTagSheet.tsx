// CourseTagSheet - search + recent courses empty state.

import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomSheet from './BottomSheet';
import type { StageCourse } from '../hooks/useStageComposer';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (c: StageCourse | null) => void;
  current: StageCourse | null;
  userId?: string | null;
}

interface RecentRow extends StageCourse {
  sub_country?: string | null;
}

export default function CourseTagSheet({ open, onClose, onSelect, current, userId }: Props) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<RecentRow[]>([]);
  const [recents, setRecents] = useState<RecentRow[]>([]);

  useEffect(() => {
    if (!open || !userId) return;
    (async () => {
      const { data } = await supabase
        .from('course_ratings')
        .select('created_at, course:golf_courses(id, name, country, sub_country)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      const seen = new Set<string>();
      const list: RecentRow[] = [];
      for (const row of (data ?? []) as Array<{ course: { id: string; name: string; country?: string | null; sub_country?: string | null } | null }>) {
        const c = row.course;
        if (!c || seen.has(c.id)) continue;
        seen.add(c.id);
        list.push({ id: c.id, name: c.name, country: c.country ?? null, sub_country: c.sub_country ?? null });
        if (list.length >= 5) break;
      }
      setRecents(list);
    })();
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (q.trim().length === 0) { setRows([]); return; }
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country')
        .ilike('name', `%${q.trim()}%`)
        .limit(20);
      setRows((data ?? []) as RecentRow[]);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const showRecents = q.trim().length === 0;

  return (
    <BottomSheet open={open} title="Tag a course" onClose={onClose} fullHeight>
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', top: 12, left: 12 }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any of 40,000+ courses"
            style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, fontSize: 14, background: '#fff', color: '#0F172A' }}
          />
        </div>
      </div>

      {current && (
        <button onClick={() => { onSelect(null); onClose(); }} style={rowBtn}>
          <div style={{ color: '#8A9099', fontSize: 13 }}>Remove current tag ({current.name})</div>
        </button>
      )}

      {showRecents ? (
        <>
          {recents.length > 0 ? (
            <>
              <div style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#94A3B8' }}>
                YOUR RECENT COURSES
              </div>
              {recents.map(r => (
                <CourseRow key={r.id} row={r} onSelect={(c) => { onSelect(c); onClose(); }} />
              ))}
              <div style={{ padding: '16px', fontSize: 12, color: '#94A3B8' }}>
                Can't see it? Search any of 40,000+ courses above.
              </div>
            </>
          ) : (
            <div style={{ padding: '24px 16px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
              Search any of 40,000+ courses above.
            </div>
          )}
        </>
      ) : (
        rows.map(r => (
          <CourseRow key={r.id} row={r} onSelect={(c) => { onSelect(c); onClose(); }} />
        ))
      )}
    </BottomSheet>
  );
}

function CourseRow({ row, onSelect }: { row: RecentRow; onSelect: (c: StageCourse) => void }) {
  const locality = row.sub_country || row.country || null;
  return (
    <button onClick={() => onSelect({ id: row.id, name: row.name, country: row.country ?? null })} style={rowBtn}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: '#F1F5F9', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={16} color="#0F172A" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
          {locality && <div style={{ fontSize: 12, color: '#94A3B8' }}>{locality}</div>}
        </div>
      </div>
    </button>
  );
}

const rowBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '10px 16px',
  border: 0,
  borderTop: '1px solid rgba(15,23,42,0.06)',
  background: 'transparent',
  cursor: 'pointer',
};
