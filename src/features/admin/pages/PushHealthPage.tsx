import React, { useEffect } from 'react';
import { AlertCircle, Bell, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { adminTheme as t } from '../theme';
import AdminLoading from '../components/AdminLoading';
import AdminAccessDenied from '../components/AdminAccessDenied';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import { usePushHealth, type PushStatus } from '../hooks/usePushHealth';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtLatency(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const STATUS_META: Record<PushStatus, { label: string; accent: string; bg: string; border: string; Icon: any }> = {
  green: { label: 'All systems operational', accent: t.okText, bg: t.okSoft,     border: '#86EFAC', Icon: CheckCircle2 },
  amber: { label: 'Attention needed',        accent: t.warnText, bg: t.warnSoft, border: '#FCD34D', Icon: AlertCircle },
  red:   { label: 'Push delivery impaired',  accent: t.dangerText, bg: t.dangerSoft, border: '#FCA5A5', Icon: XCircle },
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: 'danger' }) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadowCard,
        padding: 14,
        display: 'flex', flexDirection: 'column', gap: 6,
        minHeight: 92,
      }}
    >
      <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ color: tone === 'danger' ? t.dangerText : t.ink, fontSize: 24, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub ? <div style={{ color: t.inkMuted, fontSize: 11 }}>{sub}</div> : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{children}</div>;
}

export default function PushHealthPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = usePushHealth();

  useEffect(() => {
    const handler = () => { refetch(); };
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [refetch]);

  if (isLoading) return <AdminLoading />;

  const errMsg = (error as any)?.message ?? '';
  if (isError && /admin required/i.test(errMsg)) return <AdminAccessDenied />;

  if (isError || !data) {
    return (
      <div style={{ padding: 16, maxWidth: 1024, margin: '0 auto' }}>
        <Card>
          <EmptyState
            icon={<AlertCircle size={28} color={t.warn} />}
            title="Push health unavailable"
            subtitle={errMsg || 'Could not load push health right now.'}
          />
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: t.ink, color: t.surface,
              fontSize: 12, fontWeight: 600,
              borderRadius: 999, padding: '6px 12px',
              border: 'none', cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </Card>
      </div>
    );
  }

  const meta = STATUS_META[data.status] ?? STATUS_META.green;
  const HeroIcon = meta.Icon;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1024, margin: '0 auto' }}>
      {/* Hero status banner */}
      <section
        style={{
          background: meta.bg,
          border: `1px solid ${meta.border}`,
          borderRadius: t.radius.lg,
          boxShadow: t.shadowCard,
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <HeroIcon size={22} color={meta.accent} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ color: meta.accent, fontSize: 18, fontWeight: 700 }}>{meta.label}</div>
            <div style={{ color: t.inkMuted, fontSize: 12 }}>Checked {relTime(data.checked_at)}</div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: t.ink, color: t.surface,
              fontSize: 12, fontWeight: 600,
              borderRadius: 999, padding: '6px 12px',
              border: 'none', cursor: isFetching ? 'default' : 'pointer',
              opacity: isFetching ? 0.6 : 1, flexShrink: 0,
            }}
          >
            <RefreshCw size={12} style={isFetching ? { animation: 'admin-spin 1s linear infinite' } : undefined} />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {data.reasons.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 32, color: t.ink, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </section>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Kpi label="Sent (24h)" value={data.queue.sent_24h.toLocaleString()} />
        <Kpi
          label="Errors (24h)"
          value={data.queue.errored_24h.toLocaleString()}
          tone={data.queue.errored_24h > 0 ? 'danger' : undefined}
        />
        <Kpi
          label="Pending now"
          value={data.queue.pending_now.toLocaleString()}
          sub={data.queue.oldest_pending_minutes != null ? `oldest ${data.queue.oldest_pending_minutes}m` : undefined}
        />
        <Kpi
          label="Delivery p50"
          value={fmtLatency(data.queue.latency_p50_ms)}
          sub={data.queue.latency_max_ms != null ? `max ${fmtLatency(data.queue.latency_max_ms)}` : undefined}
        />
      </div>

      {/* Enqueue watchdog */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <SectionTitle>Enqueue watchdog</SectionTitle>
          {data.watchdog.enqueue_ok ? (
            <StatusPill tone="ok">Healthy</StatusPill>
          ) : (
            <StatusPill tone="danger">BROKEN</StatusPill>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: t.canvas, borderRadius: t.radius.md, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Notifications created (24h)
            </div>
            <div style={{ color: t.ink, fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {data.watchdog.notifications_24h_push_eligible.toLocaleString()}
            </div>
            <div style={{ color: t.inkMuted, fontSize: 11 }}>push-eligible</div>
          </div>
          <div style={{ background: t.canvas, borderRadius: t.radius.md, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Queue rows produced (24h)
            </div>
            <div style={{ color: t.ink, fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {data.watchdog.queue_rows_24h.toLocaleString()}
            </div>
            <div style={{ color: t.inkMuted, fontSize: 11 }}>auto_queue output</div>
          </div>
        </div>
        {!data.watchdog.enqueue_ok && (
          <div style={{ color: t.dangerText, fontSize: 12 }}>
            Notifications are being created but no pushes are being queued. Check Postgres logs for 'auto_queue' warnings.
          </div>
        )}
      </Card>

      {/* Sweeper cron */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <SectionTitle>Sweeper cron</SectionTitle>
          <StatusPill
            tone={data.cron.status === 'succeeded' ? 'ok' : data.cron.status === 'failed' ? 'danger' : 'neutral'}
          >
            {data.cron.status}
          </StatusPill>
        </div>
        <div style={{ color: t.inkMuted, fontSize: 13 }}>
          {data.cron.minutes_ago != null ? `last ran ${data.cron.minutes_ago}m ago` : 'no run recorded'}
        </div>
      </Card>

      {/* Error breakdown */}
      <Card>
        <SectionTitle>Error breakdown (24h)</SectionTitle>
        {data.queue.error_breakdown_24h.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={24} color={t.ok} />}
            title="No errors in the last 24 hours"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.queue.error_breakdown_24h.map((row, i) => (
              <div
                key={`${row.error}-${i}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '10px 4px',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                }}
              >
                <span style={{ color: t.ink, fontSize: 13, wordBreak: 'break-word', minWidth: 0 }}>{row.error}</span>
                <span style={{ color: t.inkMuted, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {row.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Devices */}
      <Card>
        <SectionTitle>Devices</SectionTitle>
        <div style={{ color: t.ink, fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {data.devices.enabled.toLocaleString()}
          <span style={{ color: t.inkFaint, fontSize: 14, fontWeight: 500 }}>
            {' '}of {data.devices.total.toLocaleString()} enabled
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: t.canvas, borderRadius: t.radius.md, padding: 12 }}>
            <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>iOS</div>
            <div style={{ color: t.ink, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {data.devices.ios.toLocaleString()}
            </div>
          </div>
          <div style={{ background: t.canvas, borderRadius: t.radius.md, padding: 12 }}>
            <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Android</div>
            <div style={{ color: t.ink, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {data.devices.android.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Volume 7d */}
      <Card>
        <SectionTitle>Volume (7d)</SectionTitle>
        {data.volume_7d_by_type.length === 0 ? (
          <EmptyState title="No pushes in the last 7 days" />
        ) : (
          (() => {
            const max = Math.max(...data.volume_7d_by_type.map(r => r.count), 1);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.volume_7d_by_type.map((r) => {
                  const pct = Math.max(2, Math.round((r.count / max) * 100));
                  return (
                    <div key={r.type} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
                        <span style={{ color: t.ink, fontWeight: 600 }}>{r.type}</span>
                        <span style={{ color: t.inkMuted, fontVariantNumeric: 'tabular-nums' }}>{r.count.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: t.canvas, borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: t.brand, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </Card>

      <style>{`
        @keyframes admin-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Icon reference to avoid unused import warnings when banner uses others */}
      <span style={{ display: 'none' }}><Bell size={0} /></span>
    </div>
  );
}
