import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import SectionTabs from '../components/SectionTabs';
import DataList, { type DataListColumn } from '../components/DataList';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import AppealDetailDrawer from '../components/AppealDetailDrawer';
import { useAppeals, APPEALS_QUERY_KEY, type AppealRow, type AppealStatus } from '../hooks/useAppeals';
import { useQueryClient } from '@tanstack/react-query';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import AdminAccessDenied from '../components/AdminAccessDenied';

function relTime(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

function statusTone(s: AppealStatus) {
  if (s === 'pending') return 'warn' as const;
  if (s === 'overturned') return 'ok' as const;
  return 'neutral' as const;
}

export default function AppealsPage() {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as AppealStatus) || 'pending';
  const [selected, setSelected] = useState<AppealRow | null>(null);

  const qc = useQueryClient();
  const { data = [], isLoading } = useAppeals(status);

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: APPEALS_QUERY_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  const tabs = useMemo(() => [
    { id: 'pending', label: 'Pending' },
    { id: 'overturned', label: 'Overturned' },
    { id: 'upheld', label: 'Upheld' },
    { id: 'all', label: 'All' },
  ], []);

  const setStatus = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('status', id);
    setParams(next, { replace: true });
  };

  if (!caps.viewModeration) return <AdminAccessDenied />;

  const columns: DataListColumn<AppealRow>[] = [
    { key: 'appellant', header: 'Appellant', render: (r) => <AppellantCell row={r} /> },
    { key: 'suspension', header: 'Suspension', render: (r) => {
      const a = r.appellant;
      if (!a) return <span style={{ color: t.inkMuted, fontSize: 12 }}>-</span>;
      const label = a.is_suspended
        ? (a.suspended_until ? `Until ${new Date(a.suspended_until).toLocaleDateString()}` : 'Indefinite')
        : 'Not suspended';
      return <span style={{ color: t.ink, fontSize: 13 }}>{label}</span>;
    }},
    { key: 'message', header: 'Message', render: (r) => (
      <span style={{ color: t.inkMuted, fontSize: 12 }}>{r.message.slice(0, 100)}</span>
    )},
    { key: 'age', header: 'Age', width: 140, render: (r) => (
      <span style={{ color: t.inkMuted, fontSize: 12 }}>{relTime(r.created_at)}</span>
    )},
    { key: 'status', header: 'Status', width: 110, render: (r) => (
      <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill>
    )},
  ];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <SectionTabs tabs={tabs} activeId={status} onChange={setStatus} />

      {data.length === 0 && !isLoading ? (
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title="No appeals"
          subtitle={status === 'pending' ? 'No appeals awaiting review.' : 'No appeals match this filter.'}
        />
      ) : (
        <div
          onClickCapture={(e) => {
            const target = (e.target as HTMLElement).closest('[data-row-key]') as HTMLElement | null;
            if (!target) return;
            const key = target.getAttribute('data-row-key');
            const row = data.find((r) => r.id === key);
            if (row) setSelected(row);
          }}
        >
          <DataList
            columns={columns.map((c) => ({
              ...c,
              render: (row: AppealRow) => (
                <span data-row-key={row.id} style={{ cursor: 'pointer', display: 'block' }}>
                  {c.render(row)}
                </span>
              ),
            }))}
            rows={data}
            rowKey={(r) => r.id}
            loading={isLoading}
            renderCard={(row) => (
              <div data-row-key={row.id} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <AppellantCell row={row} />
                  <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                </div>
                <div style={{ color: t.inkMuted, fontSize: 12, lineHeight: 1.45 }}>
                  {row.message.slice(0, 160)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: t.inkFaint, fontSize: 11 }}>
                  <span>
                    {row.appellant?.is_suspended
                      ? (row.appellant.suspended_until
                          ? `Until ${new Date(row.appellant.suspended_until).toLocaleDateString()}`
                          : 'Indefinite')
                      : 'Not suspended'}
                  </span>
                  <span>{relTime(row.created_at)}</span>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <AppealDetailDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        row={selected}
      />
    </div>
  );
}

function AppellantCell({ row }: { row: AppealRow }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <SquircleAvatar
        src={row.appellant?.profile_photo_url ?? undefined}
        alt={row.appellant?.display_name ?? undefined}
        size={28}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
        <span style={{ color: t.ink, fontWeight: 600, fontSize: 13 }}>
          {row.appellant?.display_name ?? row.appellant?.username ?? 'Unknown'}
        </span>
        {row.appellant?.username && (
          <span style={{ color: t.inkFaint, fontSize: 11 }}>@{row.appellant.username}</span>
        )}
      </div>
    </div>
  );
}
