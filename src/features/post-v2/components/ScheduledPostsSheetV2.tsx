// ScheduledPostsSheetV2 - list, reschedule, cancel scheduled posts.
// Data plane touches `posts` for reads and for two limited writes -
// reschedule updates scheduled_at, cancel deletes the row.
// The publisher cron is the surface that flips scheduled -> published;
// the composer does NOT create posts via .from('posts').

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BottomSheet from './BottomSheet';
import { CalendarClock, Trash2 } from 'lucide-react';
import { formatSchedule } from '../lib/formatSchedule';

interface Row {
  id: string;
  content: string | null;
  scheduled_at: string | null;
  actor_type: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | null | undefined;
  onCountChange?: (n: number) => void;
}

export default function ScheduledPostsSheetV2({ open, onClose, userId, onCountChange }: Props) {
  const [rows, setRows] = useState<Row[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) { setRows([]); return; }
    const { data } = await supabase
      .from('posts')
      .select('id, content, scheduled_at, actor_type')
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(50);
    const list = (data ?? []) as Row[];
    setRows(list);
    onCountChange?.(list.length);
  }, [userId, onCountChange]);

  useEffect(() => { if (open) void refresh(); }, [open, refresh]);

  const reschedule = async (id: string) => {
    const next = prompt('New send time (YYYY-MM-DD HH:mm, local):');
    if (!next) return;
    const dt = new Date(next);
    if (Number.isNaN(dt.getTime()) || dt.getTime() < Date.now()) { alert('Future time only.'); return; }
    await supabase.from('posts').update({ scheduled_at: dt.toISOString() }).eq('id', id);
    await refresh();
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this scheduled post?')) return;
    await supabase.from('posts').delete().eq('id', id);
    await refresh();
  };

  return (
    <BottomSheet open={open} title="Scheduled posts" onClose={onClose} fullHeight>
      {rows.length === 0 && (
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarClock size={22} color="#F8FAFC" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Nothing scheduled yet</div>
          <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: 280, lineHeight: 1.45 }}>
            Line up a post for the perfect tee time - we'll publish it on the dot.
          </div>
        </div>
      )}
      {rows.map(r => (
        <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: '#1F2428', fontWeight: 500 }}>{(r.content || '(no caption)').slice(0, 60)}</div>
            <div style={{ fontSize: 12, color: '#8A9099', marginTop: 2 }}>{r.scheduled_at ? formatSchedule(new Date(r.scheduled_at)) : '-'}</div>
          </div>
          <button onClick={() => reschedule(r.id)} style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', color: '#1F2428', borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Reschedule</button>
          <button onClick={() => cancel(r.id)} aria-label="Cancel" style={{ background: 'transparent', border: 0, color: '#8A9099', cursor: 'pointer', padding: 8 }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </BottomSheet>
  );
}
