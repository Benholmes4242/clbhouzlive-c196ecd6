// CourseTagSheet - lightweight search over golf_courses.

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BottomSheet from './BottomSheet';
import type { StageCourse } from '../hooks/useStageComposer';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (c: StageCourse | null) => void;
  current: StageCourse | null;
}

export default function CourseTagSheet({ open, onClose, onSelect, current }: Props) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<StageCourse[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (q.trim().length === 0) { setRows([]); return; }
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country')
        .ilike('name', `%${q.trim()}%`)
        .limit(20);
      setRows((data ?? []) as StageCourse[]);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <BottomSheet open={open} title="Tag a course" onClose={onClose} fullHeight>
      <div style={{ padding: '8px 16px 12px 16px' }}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 14 }}
        />
      </div>
      {current && (
        <button onClick={() => { onSelect(null); onClose(); }} style={rowBtn}>
          <div style={{ color: '#8A9099', fontSize: 13 }}>Remove current tag ({current.name})</div>
        </button>
      )}
      {rows.map(r => (
        <button key={r.id} onClick={() => { onSelect(r); onClose(); }} style={rowBtn}>
          <div style={{ fontSize: 14, color: '#1F2428', fontWeight: 500 }}>{r.name}</div>
          {r.country && <div style={{ fontSize: 12, color: '#8A9099' }}>{r.country}</div>}
        </button>
      ))}
    </BottomSheet>
  );
}

const rowBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '12px 16px',
  border: 0,
  borderTop: '1px solid rgba(0,0,0,0.07)',
  background: 'transparent',
  cursor: 'pointer',
};
