// ScheduledPostsSheetV2 - list, reschedule, cancel scheduled posts.
// Data plane touches `posts` for reads and for two limited writes -
// reschedule updates scheduled_at, cancel deletes the row.
// The publisher cron is the surface that flips scheduled -> published;
// the composer does NOT create posts via .from('posts').

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import BottomSheet from './BottomSheet';
import ScheduleSheetV2 from './ScheduleSheetV2';
import { CalendarClock, Trash2 } from 'lucide-react';
import { formatSchedule } from '../lib/formatSchedule';
import { CT } from '@/features/_shared/composerTokens';

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
  const [loading, setLoading] = useState(false);
  const [reschedTarget, setReschedTarget] = useState<Row | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) { setRows([]); return; }
    setLoading(true);
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
    setLoading(false);
  }, [userId, onCountChange]);

  useEffect(() => { if (open) void refresh(); }, [open, refresh]);

  const performReschedule = async (id: string, dt: Date | null) => {
    if (!dt) { setReschedTarget(null); return; }
    setBusyId(id);
    try {
      const { error } = await supabase.from('posts').update({ scheduled_at: dt.toISOString() }).eq('id', id);
      if (error) throw error;
      setReschedTarget(null);
      await refresh();
    } catch {
      toast.error("Couldn't reschedule. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const performCancel = async (id: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      setConfirmCancelId(null);
      await refresh();
    } catch {
      toast.error("Couldn't cancel. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <BottomSheet open={open} title="Scheduled posts" onClose={onClose} fullHeight>
        {loading && rows.length === 0 && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={`sk-${i}`} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${CT.hairline}` }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="clb-shimmer-dark" style={{ height: 14, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                  <div className="clb-shimmer-dark" style={{ height: 11, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div className="clb-shimmer-dark" style={{ height: 22, width: 92, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
          </>
        )}
        {!loading && rows.length === 0 && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: CT.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarClock size={22} color={CT.canvas} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: CT.ink }}>Nothing scheduled yet</div>
            <div style={{ fontSize: 13, color: CT.secondary, textAlign: 'center', maxWidth: 280, lineHeight: 1.45 }}>
              Line up a post for the perfect tee time - we'll publish it on the dot.
            </div>
          </div>
        )}
        {rows.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${CT.hairline}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: CT.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(r.content || '(no caption)').slice(0, 60)}</div>
              <div style={{ fontSize: 12, color: CT.secondary, marginTop: 2 }}>{r.scheduled_at ? formatSchedule(new Date(r.scheduled_at)) : '-'}</div>
            </div>
            {confirmCancelId === r.id ? (
              <>
                <span style={{ fontSize: 12, color: CT.danger, fontWeight: 600 }}>Cancel this post?</span>
                <button
                  onClick={() => void performCancel(r.id)}
                  disabled={busyId === r.id}
                  style={{ background: CT.danger, color: '#0E1216', border: 0, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {busyId === r.id ? 'Cancelling' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmCancelId(null)}
                  style={{ background: 'transparent', border: `1px solid ${CT.hairlineStrong}`, color: CT.ink, borderRadius: 999, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
                >
                  No
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setReschedTarget(r)}
                  disabled={busyId === r.id}
                  style={{ background: 'transparent', border: `1px solid ${CT.hairlineStrong}`, color: CT.ink, borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                >
                  Reschedule
                </button>
                <button
                  onClick={() => setConfirmCancelId(r.id)}
                  aria-label="Cancel"
                  style={{ background: 'transparent', border: 0, color: CT.secondary, cursor: 'pointer', padding: 8 }}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ))}
      </BottomSheet>

      <ScheduleSheetV2
        open={!!reschedTarget}
        onClose={() => setReschedTarget(null)}
        value={reschedTarget?.scheduled_at ? new Date(reschedTarget.scheduled_at) : null}
        onChange={(d) => { if (reschedTarget) void performReschedule(reschedTarget.id, d); }}
      />
    </>
  );
}
