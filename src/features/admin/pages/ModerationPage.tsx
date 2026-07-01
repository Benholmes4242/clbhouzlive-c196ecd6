import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ShieldAlert } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import SectionTabs from '../components/SectionTabs';
import KpiCard from '../components/KpiCard';
import DataList, { type DataListColumn } from '../components/DataList';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import ModerationDetailDrawer from '../components/ModerationDetailDrawer';
import { useModerationQueue, type ModerationQueueRow, type QueueFilters, type ReportStatus } from '../hooks/useModerationQueue';

function relTime(iso: string) {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '—'; }
}

function statusTone(s: ReportStatus) {
  if (s === 'pending') return 'warn' as const;
  if (s === 'reviewing') return 'neutral' as const;
  if (s === 'actioned') return 'ok' as const;
  return 'neutral' as const;
}

export default function ModerationPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as QueueFilters['status']) || 'pending';
  const type = (params.get('type') as QueueFilters['type']) || 'all';
  const [selected, setSelected] = useState<ModerationQueueRow | null>(null);

  const { rows, counts, isLoading, refetch } = useModerationQueue({ status, type });

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [refetch]);

  const setStatus = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('status', id);
    setParams(next, { replace: true });
  };
  const setType = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('type', id);
    setParams(next, { replace: true });
  };

  const statusTabs = useMemo(() => [
    { id: 'pending', label: 'Pending', count: counts.pending || undefined },
    { id: 'reviewing', label: 'Reviewing', count: counts.reviewing || undefined },
    { id: 'resolved', label: 'Resolved', count: counts.resolved || undefined },
    { id: 'all', label: 'All', count: counts.total || undefined },
  ], [counts]);

  const typeTabs = useMemo(() => [
    { id: 'all', label: 'All' },
    { id: 'user', label: 'User' },
    { id: 'post', label: 'Post' },
  ], []);

  const columns: DataListColumn<ModerationQueueRow>[] = [
    {
      key: 'target',
      header: 'Target',
      render: (row) => <TargetCell row={row} />,
    },
    {
      key: 'reasons',
      header: 'Reason(s)',
      render: (row) => <ReasonsCell reasons={row.reasons} />,
    },
    {
      key: 'reports',
      header: 'Reports',
      align: 'right',
      width: 90,
      render: (row) => (
        <span style={{ color: t.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{row.report_count}</span>
      ),
    },
    {
      key: 'age',
      header: 'Age',
      width: 140,
      render: (row) => <span style={{ color: t.inkMuted, fontSize: 12 }}>{relTime(row.created_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (row) => <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>,
    },
  ];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        <KpiCard label="Open reports" value={counts.pending + counts.reviewing} loading={isLoading} />
        <KpiCard label="Reports today" value={counts.reportsToday} loading={isLoading} />
        <KpiCard label="Actioned this week" value={counts.actionedThisWeek} loading={isLoading} />
      </div>

      <SectionTabs tabs={statusTabs} activeId={status} onChange={setStatus} />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>Type</span>
        <SectionTabs tabs={typeTabs} activeId={type} onChange={setType} />
      </div>

      {rows.length === 0 && !isLoading ? (
        <EmptyState
          icon={<ShieldAlert size={28} />}
          title="No open reports"
          subtitle="You're all caught up. New reports will appear here."
        />
      ) : (
        <div
          onClickCapture={(e) => {
            const target = (e.target as HTMLElement).closest('[data-row-key]') as HTMLElement | null;
            if (!target) return;
            const key = target.getAttribute('data-row-key');
            const row = rows.find((r) => r.key === key);
            if (row) setSelected(row);
          }}
        >
          <DataList
            columns={columns.map<DataListColumn<ModerationQueueRow>>((c) => ({
              ...c,
              render: (row: ModerationQueueRow) => (
                <span data-row-key={row.key} style={{ cursor: 'pointer', display: 'block' }}>
                  {c.render(row)}
                </span>
              ),
            }))}
            rows={rows}
            rowKey={(r) => r.key}
            loading={isLoading}
            renderCard={(row: ModerationQueueRow) => (
              <div data-row-key={row.key} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <TargetCell row={row} />
                  <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                </div>
                <ReasonsCell reasons={row.reasons} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: t.inkMuted, fontSize: 12 }}>
                  <span>{row.report_count} report{row.report_count === 1 ? '' : 's'}</span>
                  <span>{relTime(row.created_at)}</span>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <ModerationDetailDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        row={selected}
      />
    </div>
  );
}

function TargetCell({ row }: { row: ModerationQueueRow }) {
  if (row.kind === 'user') {
    const u = row.targetUser;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SquircleAvatar src={u?.profile_photo_url ?? undefined} alt={u?.display_name ?? undefined} size={32} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
          <span style={{ color: t.ink, fontWeight: 700, fontSize: 13 }}>
            {u?.display_name ?? 'Unknown user'}
          </span>
          <span style={{ color: t.inkFaint, fontSize: 11 }}>User report</span>
        </div>
      </div>
    );
  }
  const p = row.targetPost;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <SquircleAvatar src={p?.author?.profile_photo_url ?? undefined} alt={p?.author?.display_name ?? undefined} size={32} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
        <span style={{ color: t.ink, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
          {(p?.content?.trim() || '(no text)')}
        </span>
        <span style={{ color: t.inkFaint, fontSize: 11 }}>
          Post by {p?.author?.display_name ?? 'Unknown'}
        </span>
      </div>
    </div>
  );
}

function ReasonsCell({ reasons }: { reasons: string[] }) {
  const primary = reasons[0] ?? '—';
  const extra = reasons.length - 1;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span
        style={{
          padding: '2px 10px',
          borderRadius: 999,
          background: t.neutralSoft,
          color: t.ink,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {primary}
      </span>
      {extra > 0 && (
        <span style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600 }}>+{extra}</span>
      )}
    </div>
  );
}
