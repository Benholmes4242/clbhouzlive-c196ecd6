/** Both admin pro surfaces share this read/save/check path; RPC refusals remain authoritative. */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminTheme as t } from '../theme';
import { formatAgo } from '../lib/formatAgo';

type Source = { owgr_url: string; last_checked_at: string | null; last_error: string | null };
type Rank = { rank: number; ranking_date: string; source: string };
export function AdminProWorldRanking({ userId }: { userId: string }) {
  const [source, setSource] = useState<Source | null>(null);
  const [rank, setRank] = useState<Rank | null>(null);
  const [url, setUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    const [s, r] = await Promise.all([
      supabase.from('pro_world_rank_sources').select('owgr_url,last_checked_at,last_error').eq('user_id', userId).maybeSingle(),
      supabase.rpc('get_pro_world_rank', { p_user_id: userId }),
    ]);
    if (s.error) throw s.error;
    if (r.error) throw r.error;
    return { source: s.data as Source | null, rank: r.data as Rank | null };
  };
  useEffect(() => {
    let alive = true;
    setLoading(true); setSource(null); setRank(null); setEditing(false); setError(null); setUrl('');
    void load().then(value => { if (alive) { setSource(value.source); setRank(value.rank); setUrl(value.source?.owgr_url ?? ''); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId]);
  const check = async () => {
    const { data, error: err } = await supabase.functions.invoke('sync-pro-world-rankings', { body: { user_id: userId } });
    if (err) {
      const context = (err as { context?: Response }).context;
      if (context) { const text = await context.text(); let message = text; try { message = JSON.parse(text).error ?? text; } catch { /* preserve plain refusal */ } throw new Error(message); }
      throw err;
    }
    if (data?.error) throw new Error(String(data.error));
    const value = await load(); setSource(value.source); setRank(value.rank);
    if (data?.failed?.length) setError(String(data.failed[0].error));
  };
  const run = async (save: boolean) => {
    setBusy(true); setError(null);
    try {
      if (save) {
        const { data, error: err } = await supabase.rpc('admin_set_pro_owgr', { p_user_id: userId, p_owgr_url: url.trim() });
        if (err) throw err;
        if (data && typeof data === 'object' && !Array.isArray(data) && data.error) throw new Error(String(data.error));
        setEditing(false);
        if (data && typeof data === 'object' && !Array.isArray(data) && data.cleared) { setSource(null); return; }
      }
      await check();
    } catch (e) { setError(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)); }
    finally { setBusy(false); }
  };
  return <section aria-label="World ranking" style={{ padding: '12px 16px', borderBottom: `1px solid ${t.hairline}`, color: t.ink }}>
    <h5 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>World ranking</h5>
    {loading ? <span role="status">Loading…</span> : <>
      {rank && <div data-testid="pro-world-rank">#{rank.rank} · {rank.ranking_date}</div>}
      {source?.last_checked_at && <div style={{ color: t.inkMuted, fontSize: 12 }}>Checked {formatAgo(source.last_checked_at, { suffix: true })}</div>}
      {source?.last_error && <div role="alert" style={{ color: t.warn }}>{source.last_error}</div>}
      {(!source || editing) ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Input aria-label="OWGR profile link" type="url" placeholder="https://www.owgr.com/playerprofile/…" value={url} onChange={e => setUrl(e.target.value)} disabled={busy} style={{ minWidth: 0, flex: '1 1 180px', color: t.ink }} />
        <Button variant="ghost" disabled={busy || !url.trim()} onClick={() => void run(true)}>Save</Button>
        {editing && <Button variant="ghost" disabled={busy} onClick={() => { setEditing(false); setUrl(source?.owgr_url ?? ''); }}>Cancel</Button>}
      </div> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Button variant="ghost" disabled={busy} onClick={() => void run(false)}>Check now</Button>
        <Button variant="ghost" disabled={busy} onClick={() => setEditing(true)}>Change link</Button>
      </div>}
    </>}
    {error && <div role="alert" style={{ color: t.warn, marginTop: 8 }}>{error}</div>}
  </section>;
}