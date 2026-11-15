/** Catalogue rows keep server section order; request doors use the canonical Inbox sheet. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';
import { supabase } from '@/integrations/supabase/client';
import { adminVerifiedCount, type AdminVerified } from '../hooks/useAdminVerified';
import { adminTheme as t } from '../theme';
import { formatAgo } from '../lib/formatAgo';
import './adminVerified.css';
import { AdminProWorldRanking } from './AdminProWorldRanking';
export function verifiedSince(iso: string | null) {
  return iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' }).format(new Date(iso)) : null;
}
export function AdminVerifiedCard({ data, loading, error, onOpenMember }: { data: AdminVerified | undefined; loading: boolean; error: boolean; onOpenMember: (id: string) => void }) {
  const navigate = useNavigate();
  /* BRIEF_PRO_OWGR_AT_APPROVAL §4 — safety net: verified tour pros with no
     pro_player_id get one sources read; null means unread/failed, and a failed
     read shows no warning and never throws into the card. */
  const unlinkedIds = (data?.pros ?? []).filter(p => p.pro_kind === 'tour_pro' && !p.pro_player_id).map(p => p.id);
  const unlinkedKey = unlinkedIds.join(',');
  const [owgrSources, setOwgrSources] = useState<Set<string> | null>(null);
  useEffect(() => {
    let alive = true;
    setOwgrSources(null);
    if (!unlinkedKey) return;
    (async () => {
      try {
        const { data: rows, error: readError } = await supabase
          .from('pro_world_rank_sources')
          .select('user_id')
          .in('user_id', unlinkedKey.split(','));
        if (alive && !readError) setOwgrSources(new Set((rows ?? []).map(r => r.user_id as string)));
      } catch { /* failed read: no warning */ }
    })();
    return () => { alive = false; };
  }, [unlinkedKey]);
  const row = (id: string, name: string, photo: string | null, sub: React.ReactNode, badge: React.ReactNode, date: string | null, open: () => void, pending = false) => <Button key={id} variant="ghost" className="admin-verified-row" onClick={open}>
    <SquircleAvatar size={40} src={photo} alt={name} hairlineRing />
    <span className="admin-verified-content"><span className="admin-verified-name"><span>{name}</span>{badge}</span><span className="admin-verified-sub">{sub}</span></span>
    {pending ? <span className="admin-verified-right">Inbox ›</span> : date ? <span className="admin-verified-right">since<br />{verifiedSince(date)}</span> : null}
  </Button>;
  const section = (label: string, rows: React.ReactNode[]) => rows.length ? <section key={label} data-verified-section={label}><h4>{label} · {rows.length}</h4>{rows}</section> : null;
  return <div className="admin-verified-card" data-testid="admin-verified-card"><header><span>VERIFIED</span><span>{adminVerifiedCount(data) ?? '—'}</span></header>
    {loading ? <p role="status">Loading…</p> : error ? <p role="alert">Could not load verified accounts.</p> : data ? <>
      {section('PROS', data.pros.map(p => {
        const noSource = p.pro_kind === 'tour_pro' && !p.pro_player_id && owgrSources !== null && !owgrSources.has(p.id);
        const meta = [p.pro_kind === 'tour_pro' ? 'Tour professional' : 'Teaching professional', p.pro_kind === 'tour_pro' ? p.pro_tour : p.pro_club].filter(Boolean).join(' · ');
        return <div key={p.id}>{row(p.id, p.display_name ?? p.username ?? 'Member', p.avatar_url, <>{meta}{noSource && <span style={{ color: t.warn, fontSize: 12 }}> · No results source</span>}</>, <ProLabel size="small" />, p.verified_at, () => onOpenMember(p.id))}{p.pro_kind === 'tour_pro' && <AdminProWorldRanking userId={p.id} />}</div>;
      }))}
      {section('AMATEURS', (data.amateurs ?? []).map(p => row(p.id, p.display_name ?? p.username ?? 'Member', p.avatar_url, [`WAGR ${p.rank ?? '—'}`, p.last_synced_at ? `Synced ${formatAgo(p.last_synced_at, { suffix: true })}` : 'Not synced', p.last_error].filter(Boolean).join(' · '), <ProLabel size="small" kind="am" />, null, () => onOpenMember(p.id))))}
      {section('BEING CHECKED', data.pending.map(p => row(p.request_id, p.display_name ?? p.username ?? 'Member', p.avatar_url, `${p.kind === 'tour_pro' ? 'Tour professional' : 'Teaching professional'} · asked ${formatAgo(p.requested_at, { suffix: true })}`, <span className="admin-verified-pending">BEING CHECKED</span>, null, () => navigate(`/admin-v2/inbox?type=verification&request=${encodeURIComponent(p.request_id)}`), true)))}
      {section('GOLFERS', data.golfers.map(p => row(p.id, p.display_name ?? p.username ?? 'Member', p.avatar_url, 'Verified golfer', <VerifiedBadge size="sm" />, p.verified_at, () => onOpenMember(p.id))))}
      {section('BUSINESSES', data.businesses.map(p => row(p.id, p.name, p.logo_url, BUSINESS_CATEGORIES_WITH_ICONS.find(c => c.value === p.category)?.label ?? p.category ?? '', <VerifiedBadge size="sm" />, p.verified_at, () => navigate(`/admin-v2/inbox?type=verification&view=done&business=${encodeURIComponent(p.id)}`))))}
    </> : null}
  </div>;
}