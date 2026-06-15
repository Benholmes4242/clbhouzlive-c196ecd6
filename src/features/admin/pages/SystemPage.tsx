import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity, AlertCircle, ArrowLeft, ChevronDown, ChevronRight, LogOut,
  MapPin, RefreshCw, Wrench,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { panelCan } from '@/lib/panelCan';
import { adminTheme as t } from '../theme';
import SectionTabs, { type SectionTab } from '../components/SectionTabs';
import DataList from '../components/DataList';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import StatTile from '../components/StatTile';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAudit, type AuditEntry } from '../hooks/useAudit';
import { useDashboard } from '../hooks/useDashboard';

type TabId = 'audit' | 'tools' | 'settings';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function SystemPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const [params, setParams] = useSearchParams();
  const requested = (params.get('tab') as TabId | null) ?? 'audit';
  // Limited admins can only see Settings
  const initial: TabId = can.manageAdmins ? requested : 'settings';
  const [tab, setTab] = useState<TabId>(initial);

  useEffect(() => {
    if (!can.manageAdmins && tab !== 'settings') setTab('settings');
  }, [can.manageAdmins, tab]);

  const tabs: SectionTab[] = can.manageAdmins
    ? [
        { id: 'audit', label: 'Audit Log' },
        { id: 'tools', label: 'Dev Tools' },
        { id: 'settings', label: 'Settings' },
      ]
    : [{ id: 'settings', label: 'Settings' }];

  const onTab = (id: string) => {
    setTab(id as TabId);
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  return (
    <div style={containerStyle}>
      <SectionTabs tabs={tabs} activeId={tab} onChange={onTab} />
      {tab === 'audit' && can.manageAdmins && <AuditLogTab />}
      {tab === 'tools' && can.manageAdmins && <DevToolsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxWidth: 1280,
  margin: '0 auto',
};

// ─── Shared Card ──────────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{title}</div>}
            {subtitle && <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Tab 1: Audit Log ─────────────────────────────────────────────────────────

function AuditLogTab() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const { data, isLoading } = useAudit({ page, action: actionFilter });

  return (
    <Card
      title="Audit Log"
      subtitle="Recent administrative actions"
      action={
        <select
          value={actionFilter ?? ''}
          onChange={(e) => {
            setActionFilter(e.target.value || null);
            setPage(0);
          }}
          style={{
            padding: '6px 10px',
            borderRadius: t.radius.md,
            border: `1px solid ${t.line}`,
            background: t.surface,
            color: t.ink,
            fontSize: 12,
          }}
        >
          <option value="">All actions</option>
          {(data?.actions ?? []).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      }
    >
      <DataList
        loading={isLoading}
        rows={data?.rows ?? []}
        rowKey={(r) => r.id}
        columns={[
          { key: 'action', header: 'Action', render: (r) => <span style={{ fontWeight: 600 }}>{r.action}</span> },
          { key: 'target', header: 'Target', render: (r) => r.targetEmail ?? '—' },
          { key: 'when', header: 'When', align: 'right', render: (r) => <span style={{ color: t.inkMuted }}>{relTime(r.createdAt)}</span> },
        ]}
        renderCard={(r) => <AuditCard row={r} />}
        emptyTitle="No audit entries"
        emptySubtitle="Administrative actions will appear here."
      />

      {/* Pagination */}
      {(data?.rows.length ?? 0) > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={pagerBtn(page === 0)}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 12, color: t.inkFaint }}>Page {page + 1}</span>
          <button
            disabled={!data?.hasMore}
            onClick={() => setPage((p) => p + 1)}
            style={pagerBtn(!data?.hasMore)}
          >
            Next →
          </button>
        </div>
      )}
    </Card>
  );
}

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: t.radius.md,
    border: `1px solid ${t.line}`,
    background: disabled ? t.canvas : t.surface,
    color: disabled ? t.inkFaint : t.ink,
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

function AuditCard({ row }: { row: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const hasDetails = row.details && Object.keys(row.details).length > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 600, color: t.ink, fontSize: 14 }}>{row.action}</span>
        <span style={{ color: t.inkMuted, fontSize: 12, whiteSpace: 'nowrap' }}>{relTime(row.createdAt)}</span>
      </div>
      <span style={{ color: t.inkMuted, fontSize: 12 }}>{row.targetEmail ?? '—'}</span>
      {hasDetails && (
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: t.brandText,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {open ? 'Hide details' : 'Show details'}
        </button>
      )}
      {open && hasDetails && (
        <pre
          style={{
            margin: 0,
            background: t.canvas,
            border: `1px solid ${t.line}`,
            borderRadius: t.radius.md,
            padding: 10,
            fontSize: 11,
            color: t.ink,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 240,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(row.details, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Tab 2: Dev Tools ─────────────────────────────────────────────────────────

function DevToolsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EgSyncDetailCard />
      <GeocodeClubTool />
      <WhsBackfillTool />
    </div>
  );
}

function EgSyncDetailCard() {
  const { egSyncHealth, refetchAll } = useDashboard();
  const data: any = egSyncHealth.data;
  const loading = egSyncHealth.isLoading;
  const isError = egSyncHealth.isError;

  const statusMap: Record<string, { tone: any; label: string }> = {
    green: { tone: 'ok', label: 'Healthy' },
    amber: { tone: 'warn', label: 'Degraded' },
    red: { tone: 'danger', label: 'Failing' },
    idle: { tone: 'neutral', label: 'Idle' },
  };
  const status = data?.status ?? 'idle';
  const tone = statusMap[status] ?? statusMap.idle;

  return (
    <Card
      title="EG Sync Health"
      subtitle="Full breakdown of EzGolf connection sync status"
      action={
        !loading && !isError ? (
          <StatusPill tone={tone.tone}>
            <Activity size={12} /> {tone.label}
          </StatusPill>
        ) : null
      }
    >
      {loading ? (
        <div style={{ height: 120, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
      ) : isError || !data ? (
        <EmptyState
          icon={<AlertCircle size={28} color={t.warn} />}
          title="Status unavailable"
          subtitle="Could not load EG sync health right now."
        />
      ) : (
        <>
          <div className="admin-v2-eg-detail" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <StatTile label="Connected" value={data.total_connected ?? 0} />
            <StatTile label="OK" value={data.status_ok_count ?? 0} />
            <StatTile label="Auth failed" value={data.auth_failed ?? 0} />
            <StatTile label="EG unavailable" value={data.eg_unavailable ?? 0} />
            <StatTile label="Consec. failures" value={data.consecutive_failures_total ?? 0} />
            <StatTile
              label="Last attempt"
              value={data.last_attempt_at ? relTime(data.last_attempt_at) : '—'}
            />
            <StatTile
              label="Cron last run"
              value={data.cron_last_run_at ? relTime(data.cron_last_run_at) : '—'}
            />
            <StatTile label="Cron status" value={data.cron_last_status ?? '—'} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => refetchAll()}
              style={ghostBtn}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <style>{`
            @media (min-width: 640px) {
              .admin-v2-eg-detail { grid-template-columns: repeat(4, 1fr) !important; }
            }
          `}</style>
        </>
      )}
    </Card>
  );
}

function GeocodeClubTool() {
  const [clubId, setClubId] = useState('');
  const m = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('geocode-club', { body: { club_id: id } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success('Club geocoded', {
        description: data?.latitude ? `Lat ${data.latitude}, Lng ${data.longitude}` : 'Coordinates persisted.',
      });
    },
    onError: (e: any) => toast.error('Geocode failed', { description: e?.message ?? 'Unknown error' }),
  });

  return (
    <Card
      title="Geocode Club"
      subtitle="Resolve coordinates for a golf_clubs row via OpenStreetMap"
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          placeholder="club id (uuid)"
          style={{
            flex: '1 1 220px',
            minWidth: 0,
            padding: '10px 12px',
            borderRadius: t.radius.md,
            border: `1px solid ${t.line}`,
            background: t.canvas,
            color: t.ink,
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          disabled={!clubId.trim() || m.isPending}
          onClick={() => m.mutate(clubId.trim())}
          style={primaryBtn(!clubId.trim() || m.isPending)}
        >
          <MapPin size={14} /> {m.isPending ? 'Running…' : 'Geocode'}
        </button>
      </div>
    </Card>
  );
}

function WhsBackfillTool() {
  const [confirm, setConfirm] = useState(false);
  const m = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('backfill-whs-course-mapping', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const summary = data?.matched != null
        ? `Matched ${data.matched}, unmatched ${data.unmatched ?? 0}`
        : 'Backfill complete.';
      toast.success('WHS backfill finished', { description: summary });
    },
    onError: (e: any) => toast.error('Backfill failed', { description: e?.message ?? 'Unknown error' }),
    onSettled: () => setConfirm(false),
  });

  return (
    <Card
      title="WHS Course Mapping Backfill"
      subtitle="Re-link WHS courses to golf_courses entries"
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          disabled={m.isPending}
          onClick={() => setConfirm(true)}
          style={primaryBtn(m.isPending)}
        >
          <Wrench size={14} /> {m.isPending ? 'Running…' : 'Run backfill'}
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => m.mutate()}
        busy={m.isPending}
        title="Run WHS backfill?"
        description="This will re-process WHS course mappings against golf_courses. Safe to re-run but may take a moment."
        confirmLabel="Run backfill"
      />
    </Card>
  );
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 14px',
  borderRadius: t.radius.md,
  border: 'none',
  background: disabled ? t.inkFaint : t.ink,
  color: t.surface,
  fontSize: 13,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  transition: 'background .12s, opacity .12s',
});

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: t.radius.md,
  border: `1px solid ${t.line}`,
  background: t.surface,
  color: t.ink,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background .12s',
};

// ─── Tab 3: Settings ──────────────────────────────────────────────────────────

function SettingsTab() {
  const { user } = useSupabaseSession();
  const { role } = usePanelRole();

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out');
      window.location.assign('/');
    } catch (e: any) {
      toast.error('Sign out failed', { description: e?.message });
    }
  };

  const roleLabel =
    role === 'full' ? 'Full Admin' : role === 'limited' ? 'Limited Admin' : '—';

  return (
    <Card title="Account">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Signed in as" value={user?.email ?? '—'} />
        <Field label="User ID" value={user?.id ?? '—'} mono />
        <Field label="Role">
          <StatusPill tone={role === 'full' ? 'ok' : role === 'limited' ? 'warn' : 'neutral'}>
            {roleLabel}
          </StatusPill>
        </Field>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        <Link to="/clubhouse" style={{ textDecoration: 'none' }}>
          <button style={ghostBtn}>
            <ArrowLeft size={12} /> Back to App
          </button>
        </Link>
        <button onClick={signOut} style={{ ...ghostBtn, color: t.dangerText, borderColor: t.dangerSoft }}>
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
  children,
}: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </span>
      {children ?? (
        <span
          style={{
            color: t.ink,
            fontSize: 13,
            fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '60%',
          }}
          title={value}
        >
          {value}
        </span>
      )}
    </div>
  );
}
