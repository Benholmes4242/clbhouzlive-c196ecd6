/** Both admin pro surfaces share this read/save/check path; RPC refusals remain authoritative. */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminTheme as t } from '../theme';
import { formatAgo } from '../lib/formatAgo';
import { londonDate } from '../lib/memberRadarDisplay';
import { CC3, NUM, PANEL_META } from './InboxPanels';
import { btnOutline, btnBrand } from './InboxQueueRow';

type Source = { owgr_url: string; last_checked_at: string | null; last_error: string | null };
type Rank = { rank: number; ranking_date: string; source: string };
export function AdminProWorldRanking({ userId, variant = 'default' }: { userId: string; variant?: 'default' | 'v3' }) {
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
  // Members opts in to v3 presentation; the default return below stays frozen.
  if (variant === 'v3') return <section aria-label="World ranking" style={{ ...NUM, margin: '0 14px 10px 58px', background: CC3.inset, borderRadius: 11, padding: '9px 10px 10px', color: CC3.ink }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: CC3.faint }}>World ranking</span>
      {!loading && (!source ? <span data-tone="bad" style={{ ...PANEL_META, color: CC3.bad }}>no results source</span> : source.last_checked_at ? <span style={PANEL_META}>checked {formatAgo(source.last_checked_at, { suffix: true })}</span> : null)}
    </div>
    {loading ? <span role="status" style={{ fontSize: 11, color: CC3.faint }}>Loading…</span> : <>
      {rank && <div data-testid="pro-world-rank" style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}><span style={{ ...NUM, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>#{rank.rank}</span><span style={{ ...NUM, fontSize: 11, color: CC3.faint }}>{londonDate(rank.ranking_date, { day: 'numeric', month: 'short' })}</span></div>}
      {source?.last_error && <div role="alert" style={{ color: CC3.bad, fontSize: 11, marginTop: 8 }}>{source.last_error}</div>}
      {(!source || editing) ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
        <Input aria-label="OWGR profile link" type="url" placeholder="https://www.owgr.com/playerprofile/…" value={url} onChange={e => setUrl(e.target.value)} disabled={busy} style={{ flex: '1 1 160px', minWidth: 0, height: 30, borderRadius: 9, background: CC3.canvas, border: 'none', fontSize: 12, color: CC3.ink, padding: '0 10px' }} />
        <Button variant={null} size={null} disabled={busy || !url.trim()} onClick={() => void run(true)} style={{ ...btnBrand(busy || !url.trim()), textTransform: 'uppercase' }}>Save</Button>
        {editing && <Button variant={null} size={null} disabled={busy} onClick={() => { setEditing(false); setUrl(source?.owgr_url ?? ''); }} style={{ ...btnOutline(busy), textTransform: 'uppercase' }}>Cancel</Button>}
      </div> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
        <Button variant={null} size={null} disabled={busy} onClick={() => void run(false)} style={{ ...btnOutline(busy), textTransform: 'uppercase' }}>Check now</Button>
        <Button variant={null} size={null} disabled={busy} onClick={() => setEditing(true)} style={{ ...btnOutline(), textTransform: 'uppercase' }}>Change link</Button>
      </div>}
    </>}
    {error && <div role="alert" style={{ color: CC3.bad, fontSize: 11, marginTop: 8 }}>{error}</div>}
  </section>;
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