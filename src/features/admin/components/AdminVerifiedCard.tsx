/** Catalogue rows keep server section order; request doors use the canonical Inbox sheet. */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';
import { adminVerifiedCount, type AdminVerified } from '../hooks/useAdminVerified';
import { formatAgo } from '../lib/formatAgo';
import './adminVerified.css';
export function verifiedSince(iso: string | null) {
  return iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' }).format(new Date(iso)) : null;
}
export function AdminVerifiedCard({ data, loading, error, onOpenMember }: { data: AdminVerified | undefined; loading: boolean; error: boolean; onOpenMember: (id: string) => void }) {
  const navigate = useNavigate();
  const row = (id: string, name: string, photo: string | null, sub: string, badge: React.ReactNode, date: string | null, open: () => void, pending = false) => <Button key={id} variant="ghost" className="admin-verified-row" onClick={open}>
    <SquircleAvatar size={40} src={photo} alt={name} hairlineRing />
    <span className="admin-verified-content"><span className="admin-verified-name"><span>{name}</span>{badge}</span><span className="admin-verified-sub">{sub}</span></span>
    {pending ? <span className="admin-verified-right">Inbox ›</span> : date ? <span className="admin-verified-right">since<br />{verifiedSince(date)}</span> : null}
  </Button>;
  const section = (label: string, rows: React.ReactNode[]) => rows.length ? <section key={label} data-verified-section={label}><h4>{label} · {rows.length}</h4>{rows}</section> : null;
  return <div className="admin-verified-card" data-testid="admin-verified-card"><header><span>VERIFIED</span><span>{adminVerifiedCount(data) ?? '—'}</span></header>
    {loading ? <p role="status">Loading…</p> : error ? <p role="alert">Could not load verified accounts.</p> : data ? <>
      {section('PROS', data.pros.map(p => row(p.id, p.display_name ?? p.username ?? 'Member', p.avatar_url, [p.pro_kind === 'tour_pro' ? 'Tour professional' : 'Teaching professional', p.pro_kind === 'tour_pro' ? p.pro_tour : p.pro_club].filter(Boolean).join(' · '), <ProLabel size="small" />, p.verified_at, () => onOpenMember(p.id))))}
      {section('BEING CHECKED', data.pending.map(p => row(p.request_id, p.display_name ?? p.username ?? 'Member', p.avatar_url, `${p.kind === 'tour_pro' ? 'Tour professional' : 'Teaching professional'} · asked ${formatAgo(p.requested_at, { suffix: true })}`, <span className="admin-verified-pending">BEING CHECKED</span>, null, () => navigate(`/admin-v2/inbox?type=verification&request=${encodeURIComponent(p.request_id)}`), true)))}
      {section('GOLFERS', data.golfers.map(p => row(p.id, p.display_name ?? p.username ?? 'Member', p.avatar_url, 'Verified golfer', <VerifiedBadge size="sm" />, p.verified_at, () => onOpenMember(p.id))))}
      {section('BUSINESSES', data.businesses.map(p => row(p.id, p.name, p.logo_url, BUSINESS_CATEGORIES_WITH_ICONS.find(c => c.value === p.category)?.label ?? p.category ?? '', <VerifiedBadge size="sm" />, p.verified_at, () => navigate(`/admin-v2/inbox?type=verification&view=done&business=${encodeURIComponent(p.id)}`))))}
    </> : null}
  </div>;
}