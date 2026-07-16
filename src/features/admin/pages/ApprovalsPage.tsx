import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import SectionTabs from '../components/SectionTabs';
import DataList, { type DataListColumn } from '../components/DataList';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer';
import {
  useAdminActionRequests,
  APPROVAL_QUERY_KEY,
  type AdminRequestRow,
  type AdminRequestStatus,
} from '../hooks/useAdminActionRequests';
import { useQueryClient } from '@tanstack/react-query';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import AdminAccessDenied from '../components/AdminAccessDenied';

const ACTION_LABEL: Record<string, string> = {
  permanent_ban: 'Permanent ban',
  delete_user: 'Delete user',
  role_change: 'Role change',
};

function relTime(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

function statusTone(s: AdminRequestStatus) {
  if (s === 'pending') return 'warn' as const;
  if (s === 'approved') return 'ok' as const;
  if (s === 'rejected') return 'danger' as const;
  return 'neutral' as const;
}

export default function ApprovalsPage() {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as AdminRequestStatus) || 'pending';
  const [selected, setSelected] = useState<AdminRequestRow | null>(null);

  const qc = useQueryClient();
  const { data = [], isLoading } = useAdminActionRequests(status);

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: APPROVAL_QUERY_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  const tabs = useMemo(() => [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All' },
  ], []);

  const setStatus = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('status', id);
    setParams(next, { replace: true });
  };

  if (!caps.approveRequests) return <AdminAccessDenied />;

  const columns: DataListColumn<AdminRequestRow>[] = [
    { key: 'action', header: 'Action', render: (r) => (
      <span style={{ color: t.ink, fontWeight: 700, fontSize: 13 }}>{ACTION_LABEL[r.action_type] ?? r.action_type}</span>
    )},
    { key: 'target', header: 'Target', render: (r) => <TargetCell row={r} /> },
    { key: 'requester', header: 'Requester', render: (r) => (
      <span style={{ color: t.ink, fontSize: 13 }}>
        {r.requester?.display_name ?? r.requester?.username ?? '-'}
      </span>
    )},
    { key: 'summary', header: 'Reason', render: (r) => {
      const p = (r.payload ?? {}) as any;
      const text = p.reason ?? p.roleAction ?? '';
      return <span style={{ color: t.inkMuted, fontSize: 12 }}>{String(text).slice(0, 80)}</span>;
    }},
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
          icon={<CheckCircle2 size={28} />}
          title="No requests"
          subtitle={status === 'pending' ? 'No pending approvals right now.' : 'No requests match this filter.'}
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
            columns={columns.map<DataListColumn<AdminRequestRow>>((c) => ({
              ...c,
              render: (row: AdminRequestRow) => (
                <span data-row-key={row.id} style={{ cursor: 'pointer', display: 'block' }}>
                  {c.render(row)}
                </span>
              ),
            }))}
            rows={data}
            rowKey={(r) => r.id}
            loading={isLoading}
            renderCard={(row: AdminRequestRow) => (
              <div data-row-key={row.id} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: t.ink }}>{ACTION_LABEL[row.action_type] ?? row.action_type}</span>
                  <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                </div>
                <TargetCell row={row} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: t.inkMuted, fontSize: 12 }}>
                  <span>by {row.requester?.display_name ?? row.requester?.username ?? '-'}</span>
                  <span>{relTime(row.created_at)}</span>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <ApprovalDetailDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        row={selected}
      />
    </div>
  );
}

function TargetCell({ row }: { row: AdminRequestRow }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <SquircleAvatar
        src={row.target?.profile_photo_url ?? undefined}
        alt={row.target?.display_name ?? undefined}
        size={28}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
        <span style={{ color: t.ink, fontWeight: 600, fontSize: 13 }}>
          {row.target?.display_name ?? row.target?.username ?? row.target_email ?? 'Unknown'}
        </span>
        {row.target?.username && (
          <span style={{ color: t.inkFaint, fontSize: 11 }}>@{row.target.username}</span>
        )}
      </div>
    </div>
  );
}
