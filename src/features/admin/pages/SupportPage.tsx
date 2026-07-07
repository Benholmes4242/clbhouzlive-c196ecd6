import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LifeBuoy } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatDistanceToNow } from 'date-fns';
import { adminTheme as t } from '../theme';
import KpiCard from '../components/KpiCard';
import DataList, { type DataListColumn } from '../components/DataList';
import EmptyState from '../components/EmptyState';
import SectionTabs from '../components/SectionTabs';
import StatusPill from '../components/StatusPill';
import AdminAccessDenied from '../components/AdminAccessDenied';
import SupportTicketDrawer from '../components/SupportTicketDrawer';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import {
  SUPPORT_TICKETS_KEY,
  useSupportTickets,
  type SupportStatus,
  type SupportTicketRow,
} from '../hooks/useSupportTickets';

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  account: 'Account',
  handicap: 'Handicap',
  billing: 'Billing',
  report: 'Report',
  other: 'Other',
};

const STATUS_TABS: { id: 'all' | SupportStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

function statusTone(s: SupportStatus): 'warn' | 'ok' | 'neutral' {
  if (s === 'open' || s === 'in_progress') return 'warn';
  if (s === 'resolved' || s === 'closed') return 'ok';
  return 'neutral';
}

function statusLabel(s: SupportStatus): string {
  return STATUS_TABS.find((x) => x.id === s)?.label ?? s;
}

function relTime(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return ''; }
}

function truncate(s: string | null, n = 80): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function SupportPage() {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<'all' | SupportStatus>('all');
  const [selected, setSelected] = useState<SupportTicketRow | null>(null);

  const { data = [], isLoading } = useSupportTickets();

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  // Deep-link via ?ticket=ID
  useEffect(() => {
    const id = params.get('ticket');
    if (!id || data.length === 0) return;
    const row = data.find((r) => r.id === id);
    if (row && (!selected || selected.id !== id)) setSelected(row);
  }, [params, data, selected]);

  // Keep selected in sync with latest data (status/last_sender)
  useEffect(() => {
    if (!selected) return;
    const fresh = data.find((r) => r.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [data, selected]);

  const kpis = useMemo(() => {
    const open = data.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
    const awaiting = data.filter(
      (t) => t.last_sender === 'user' && t.status !== 'resolved' && t.status !== 'closed',
    ).length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const resolvedWeek = data.filter(
      (t) => (t.status === 'resolved' || t.status === 'closed') &&
        new Date(t.last_message_at).getTime() >= weekAgo,
    ).length;
    return { open, awaiting, resolvedWeek };
  }, [data]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter((t) => t.status === statusFilter);
  }, [data, statusFilter]);

  if (!caps.viewModeration) return <AdminAccessDenied />;

  const openTicket = (row: SupportTicketRow) => {
    setSelected(row);
    const next = new URLSearchParams(params);
    next.set('ticket', row.id);
    setParams(next, { replace: true });
  };

  const closeTicket = () => {
    setSelected(null);
    const next = new URLSearchParams(params);
    next.delete('ticket');
    setParams(next, { replace: true });
  };

  const columns: DataListColumn<SupportTicketRow>[] = [
    {
      key: 'user', header: 'User', render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <SquircleAvatar
            src={r.profile?.profile_photo_url ?? undefined}
            alt={r.profile?.display_name ?? undefined}
            size={32}
            hairlineRing
            ringColor={LIGHT_HAIRLINE}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
            <span style={{ color: t.ink, fontWeight: 600, fontSize: 13 }}>
              {r.profile?.display_name || r.profile?.username || 'Unknown'}
            </span>
            {r.profile?.username && (
              <span style={{ color: t.inkFaint, fontSize: 11 }}>@{r.profile.username}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'subject', header: 'Subject', render: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.last_sender === 'user' && r.status !== 'resolved' && r.status !== 'closed' && (
              <span
                aria-label="Awaiting reply"
                title="Awaiting reply"
                style={{ width: 8, height: 8, borderRadius: '50%', background: t.brand, flexShrink: 0 }}
              />
            )}
            <span style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>{r.subject}</span>
          </div>
          <span style={{ color: t.inkFaint, fontSize: 11 }}>{truncate(r.snippet, 90)}</span>
        </div>
      ),
    },
    {
      key: 'category', header: 'Category', width: 120, render: (r) => (
        <span style={{
          fontSize: 11, fontWeight: 600, color: t.inkMuted,
          padding: '2px 8px', borderRadius: 999,
          background: t.neutralSoft, textTransform: 'uppercase', letterSpacing: 0.3,
        }}>
          {CATEGORY_LABELS[r.category] ?? r.category}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', width: 120, render: (r) => (
        <StatusPill tone={statusTone(r.status)}>{statusLabel(r.status)}</StatusPill>
      ),
    },
    {
      key: 'activity', header: 'Activity', width: 130, align: 'right', render: (r) => (
        <span style={{ color: t.inkMuted, fontSize: 12 }}>{relTime(r.last_message_at)}</span>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KpiCard label="Open" value={kpis.open.toLocaleString()} loading={isLoading} />
        <KpiCard label="Awaiting reply" value={kpis.awaiting.toLocaleString()} loading={isLoading} />
        <KpiCard label="Resolved this week" value={kpis.resolvedWeek.toLocaleString()} loading={isLoading} />
      </div>

      <SectionTabs
        tabs={STATUS_TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: tab.id === 'all' ? data.length : data.filter((t) => t.status === tab.id).length,
        }))}
        activeId={statusFilter}
        onChange={(id) => setStatusFilter(id as any)}
      />

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={<LifeBuoy size={28} />}
          title="No tickets"
          subtitle="Support tickets will appear here as users submit them."
        />
      ) : (
        <div
          onClickCapture={(e) => {
            const target = (e.target as HTMLElement).closest('[data-ticket-id]') as HTMLElement | null;
            if (!target) return;
            const id = target.getAttribute('data-ticket-id');
            const row = filtered.find((r) => r.id === id);
            if (row) openTicket(row);
          }}
        >
          <DataList
            columns={columns.map((c) => ({
              ...c,
              render: (row: SupportTicketRow) => (
                <span data-ticket-id={row.id} style={{ cursor: 'pointer', display: 'block' }}>
                  {c.render(row)}
                </span>
              ),
            }))}
            rows={filtered}
            rowKey={(r) => r.id}
            loading={isLoading}
            renderCard={(row) => (
              <div data-ticket-id={row.id} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <SquircleAvatar
                    src={row.profile?.profile_photo_url ?? undefined}
                    alt={row.profile?.display_name ?? undefined}
                    size={34}
                    hairlineRing
                    ringColor={LIGHT_HAIRLINE}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {row.last_sender === 'user' && row.status !== 'resolved' && row.status !== 'closed' && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.brand, flexShrink: 0 }} />
                      )}
                      <span style={{ color: t.ink, fontWeight: 600, fontSize: 14 }}>{row.subject}</span>
                    </div>
                    <span style={{ color: t.inkFaint, fontSize: 11 }}>
                      {row.profile?.display_name || row.profile?.username || 'Unknown'} · {relTime(row.last_message_at)}
                    </span>
                  </div>
                </div>
                <div style={{ color: t.inkMuted, fontSize: 12, lineHeight: 1.4 }}>
                  {truncate(row.snippet, 120)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusPill tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusPill>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: t.inkMuted,
                    padding: '2px 8px', borderRadius: 999,
                    background: t.neutralSoft, textTransform: 'uppercase', letterSpacing: 0.3,
                  }}>
                    {CATEGORY_LABELS[row.category] ?? row.category}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <SupportTicketDrawer ticket={selected} onClose={closeTicket} />
    </div>
  );
}
