import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../theme';
import ConfirmDialog from './ConfirmDialog';

/**
 * Admin-only club attachment for a course record. Writes go through
 * `admin_set_course_club` (is_admin-guarded RPC, applied by hand). The RPC
 * refuses to overwrite a different club, so reattaching is detach-then-attach.
 */
export default function CourseClubControl({ courseId, clubId }: { courseId: string; clubId: string | null }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Array<{ id: string; name: string; sub_country: string | null }>>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDetach, setConfirmDetach] = useState(false);

  const { data: club } = useQuery({
    queryKey: ['admin-v2', 'courses', 'club', clubId],
    queryFn: async () => {
      if (!clubId) return null;
      const { data } = await supabase.from('golf_clubs').select('id, name').eq('id', clubId).maybeSingle();
      return data as { id: string; name: string } | null;
    },
    enabled: !!clubId,
    staleTime: 30_000,
  });

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits([]); setSearching(false); return; }
    let cancelled = false;
    setSearching(true);
    const h = setTimeout(async () => {
      const { data } = await supabase
        .from('golf_clubs')
        .select('id, name, sub_country')
        .ilike('name', `%${term}%`)
        .limit(10);
      if (cancelled) return;
      setHits((data ?? []) as any);
      setSearching(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(h); };
  }, [q]);

  const setClub = async (next: string | null) => {
    setBusy(true);
    try {
      const { error } = await (supabase.rpc as any)('admin_set_course_club', { p_course_id: courseId, p_club_id: next });
      if (error) throw error;
      toast.success(next ? `Attached to ${picked?.name ?? 'club'}` : `Removed from ${club?.name ?? 'club'}`);
      setPicked(null); setQ(''); setHits([]);
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses'] });
      qc.invalidateQueries({ queryKey: ['club-course-analytics'] });
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update club');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const ghost: React.CSSProperties = {
    background: 'transparent', border: `1px solid ${t.line}`, borderRadius: t.radius.md,
    color: t.ink, fontSize: 12.5, fontWeight: 600, padding: '6px 12px', cursor: busy ? 'default' : 'pointer',
    opacity: busy ? 0.55 : 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, color: clubId ? t.ink : t.inkMuted, fontWeight: clubId ? 600 : 400 }}>
          {clubId ? (club?.name ?? '…') : 'Not attached to a club'}
        </div>
        {clubId && (
          <button type="button" disabled={busy} onClick={() => setConfirmDetach(true)} style={ghost}>
            Remove from club
          </button>
        )}
      </div>

      {!clubId && (
        <>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPicked(null); }}
            placeholder="Search clubs"
            style={{
              height: 36, padding: '0 10px', borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontSize: 13,
            }}
          />
          {picked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.ink }}>
              <span>Selected: <b>{picked.name}</b></span>
              <button type="button" onClick={() => setPicked(null)} style={ghost}>Change</button>
              <button type="button" disabled={busy} onClick={() => setClub(picked.id)} style={{ ...ghost, background: t.ink, color: t.surface, border: 'none' }}>
                Attach
              </button>
            </div>
          ) : searching ? (
            <div style={{ color: t.inkMuted, fontSize: 12 }}>Searching…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {hits.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPicked({ id: c.id, name: c.name })}
                  style={{ textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${t.line}`, padding: '7px 2px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{c.name}</div>
                  {c.sub_country && <div style={{ fontSize: 11.5, color: t.inkMuted }}>{c.sub_country}</div>}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDetach}
        onClose={() => setConfirmDetach(false)}
        onConfirm={async () => { if (await setClub(null)) setConfirmDetach(false); }}
        title={`Remove from ${club?.name ?? 'this club'}?`}
        description={`This course will no longer belong to ${club?.name ?? 'this club'}. Attaching it to another club is a separate step.`}
        tone="danger"
        confirmLabel="Remove from club"
        busy={busy}
      />
    </div>
  );
}
