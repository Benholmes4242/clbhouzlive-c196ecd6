import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardList, Copy, Check, Rocket } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import KpiCard from '../components/KpiCard';
import DataList, { type DataListColumn } from '../components/DataList';
import EmptyState from '../components/EmptyState';
import DetailDrawer from '../components/DetailDrawer';
import AdminAccessDenied from '../components/AdminAccessDenied';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusPill from '../components/StatusPill';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import {
  useWaitlistSummary,
  useWaitlistDrilldown,
  useWaitlistNotifyStatus,
  WAITLIST_SUMMARY_KEY,
  WAITLIST_NOTIFY_STATUS_KEY,
  WAITLIST_DRILLDOWN_KEY,
  type WaitlistSummaryRow,
} from '../hooks/useWaitlistDemand';

function relTime(iso: string | null): string {
  if (!iso) return '-';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

function FlagBadge({ iso, size = 22 }: { iso: string | null; size?: number }) {
  const label = iso ? iso.toUpperCase() : '?';
  return (
    <div
      aria-hidden
      style={{
        width: size, height: size, borderRadius: 6,
        background: t.canvas, border: `1px solid ${t.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: t.inkMuted, letterSpacing: 0.3,
      }}
    >
      {label.slice(0, 3)}
    </div>
  );
}

export default function WaitlistPage() {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<WaitlistSummaryRow | null>(null);
  const [copied, setCopied] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [launching, setLaunching] = useState(false);

  const { data = [], isLoading } = useWaitlistSummary();
  const { data: drilldown = [], isLoading: drilldownLoading } = useWaitlistDrilldown(
    selected?.country_id ?? null,
  );
  const { data: notifyStatus = {} } = useWaitlistNotifyStatus();

  useEffect(() => {
    const handler = () => {
      qc.invalidateQueries({ queryKey: WAITLIST_SUMMARY_KEY });
      qc.invalidateQueries({ queryKey: WAITLIST_NOTIFY_STATUS_KEY });
    };
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  const handleLaunch = async () => {
    if (!selected) return;
    setLaunching(true);
    try {
      const { data: count, error } = await supabase.rpc('admin_launch_authority', {
        _country_id: selected.country_id,
        _body_name: selected.body_name,
      });
      if (error) throw error;
      const n = Number(count ?? 0);
      if (n > 0) toast.success(`Notified ${n} golfer${n === 1 ? '' : 's'}`);
      else toast('No one new to notify');
      qc.invalidateQueries({ queryKey: WAITLIST_SUMMARY_KEY });
      qc.invalidateQueries({ queryKey: WAITLIST_NOTIFY_STATUS_KEY });
      qc.invalidateQueries({ queryKey: WAITLIST_DRILLDOWN_KEY(selected.country_id) });
      setLaunchOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Launch failed');
    } finally {
      setLaunching(false);
    }
  };

  if (!caps.viewModeration) return <AdminAccessDenied />;

  const totals = useMemo(() => {
    const total = data.reduce((sum, r) => sum + r.total, 0);
    const weekly = data.reduce((sum, r) => sum + r.joined_last_7d, 0);
    return { total, countries: data.length, weekly };
  }, [data]);

  const onCopy = async () => {
    const text = data.map((r) => `${r.body_name}: ${r.total} waiting`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const isLaunched = (countryId: string): boolean => {
    const s = notifyStatus[countryId];
    return !!s && s.total > 0 && s.pending === 0;
  };

  const columns: DataListColumn<WaitlistSummaryRow>[] = [
    { key: 'country', header: 'Country', render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FlagBadge iso={r.iso} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
          <span style={{ color: t.ink, fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {r.country_name}
            {isLaunched(r.country_id) && <StatusPill tone="ok">Launched</StatusPill>}
          </span>
          <span style={{ color: t.inkFaint, fontSize: 11 }}>{r.body_name}</span>
        </div>
      </div>
    )},
    { key: 'total', header: 'Total', width: 90, align: 'right', render: (r) => (
      <span style={{ color: t.ink, fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
        {r.total.toLocaleString()}
      </span>
    )},
    { key: 'weekly', header: 'This week', width: 110, align: 'right', render: (r) => (
      <span style={{ color: r.joined_last_7d > 0 ? t.okText : t.inkMuted, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {r.joined_last_7d > 0 ? `+${r.joined_last_7d}` : '0'}
      </span>
    )},
    { key: 'latest', header: 'Latest join', width: 160, render: (r) => (
      <span style={{ color: t.inkMuted, fontSize: 12 }}>{relTime(r.latest_join)}</span>
    )},
  ];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KpiCard label="Total signups" value={totals.total.toLocaleString()} loading={isLoading} />
        <KpiCard label="Countries requested" value={totals.countries.toLocaleString()} loading={isLoading} />
        <KpiCard label="Joined this week" value={totals.weekly.toLocaleString()} loading={isLoading} />
      </div>

      {/* Header row with copy */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: t.inkFaint, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Handicap demand
          </span>
          <span style={{ color: t.ink, fontSize: 15, fontWeight: 700 }}>By governing body</span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={data.length === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: t.radius.md,
            background: t.surface, color: t.ink,
            border: `1px solid ${t.line}`, fontSize: 12, fontWeight: 600,
            cursor: data.length === 0 ? 'not-allowed' : 'pointer',
            opacity: data.length === 0 ? 0.5 : 1,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy summary'}
        </button>
      </div>

      {data.length === 0 && !isLoading ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="No waitlist signups yet"
          subtitle="When golfers request an unsupported authority, they will appear here."
        />
      ) : (
        <div
          onClickCapture={(e) => {
            const target = (e.target as HTMLElement).closest('[data-row-key]') as HTMLElement | null;
            if (!target) return;
            const key = target.getAttribute('data-row-key');
            const row = data.find((r) => r.country_id === key);
            if (row) setSelected(row);
          }}
        >
          <DataList
            columns={columns.map((c) => ({
              ...c,
              render: (row: WaitlistSummaryRow) => (
                <span data-row-key={row.country_id} style={{ cursor: 'pointer', display: 'block' }}>
                  {c.render(row)}
                </span>
              ),
            }))}
            rows={data}
            rowKey={(r) => r.country_id}
            loading={isLoading}
            renderCard={(row) => (
              <div data-row-key={row.country_id} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <FlagBadge iso={row.iso} />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
                      <span style={{ color: t.ink, fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {row.country_name}
                        {isLaunched(row.country_id) && <StatusPill tone="ok">Launched</StatusPill>}
                      </span>
                      <span style={{ color: t.inkFaint, fontSize: 11 }}>{row.body_name}</span>
                    </div>
                  </div>
                  <div style={{ color: t.ink, fontWeight: 700, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
                    {row.total.toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: t.inkFaint, fontSize: 11 }}>
                  <span style={{ color: row.joined_last_7d > 0 ? t.okText : t.inkMuted, fontWeight: 600 }}>
                    {row.joined_last_7d > 0 ? `+${row.joined_last_7d} this week` : 'No new this week'}
                  </span>
                  <span>{relTime(row.latest_join)}</span>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <DetailDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.body_name}
        subtitle={selected ? `${selected.total.toLocaleString()} golfers waiting` : undefined}
      >
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {drilldownLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 52, background: t.canvas, borderRadius: t.radius.md,
                  animation: 'admin-pulse 1.4s ease-in-out infinite',
                }}
              />
            ))
          ) : drilldown.length === 0 ? (
            <EmptyState title="No signups" subtitle="This country has no golfers waiting." />
          ) : (
            drilldown.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  background: t.surface,
                  border: `1px solid ${t.line}`,
                  borderRadius: t.radius.md,
                }}
              >
                <SquircleAvatar
                  src={row.profile?.profile_photo_url ?? undefined}
                  alt={row.profile?.display_name ?? undefined}
                  size={32}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0, flex: 1 }}>
                  <span style={{ color: t.ink, fontWeight: 600, fontSize: 13 }}>
                    {row.profile?.display_name ?? row.profile?.username ?? 'Unknown'}
                  </span>
                  {row.profile?.username && (
                    <span style={{ color: t.inkFaint, fontSize: 11 }}>@{row.profile.username}</span>
                  )}
                </div>
                <span style={{ color: t.inkMuted, fontSize: 11 }}>{relTime(row.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </DetailDrawer>
    </div>
  );
}
