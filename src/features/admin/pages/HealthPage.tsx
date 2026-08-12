import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, Bell, CheckCircle2, ChevronDown, ChevronUp,
  Play, Radio, RefreshCw, Zap,
} from 'lucide-react';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { adminTheme as t } from '../theme';
import SectionTabs, { type SectionTab } from '../components/SectionTabs';
import AdminErrorState from '../components/AdminErrorState';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
import {
  computeEchoChip, computePushChip, computeEgChip, computeCronChip,
  computeErrorsChip,
  type ChipState,
} from '../lib/healthChips';
import { useErrorCount24h } from '../hooks/useStability';
import { AuditLogTab, DevToolsTab, SettingsTab } from './SystemPage';
import VideoPerfPage from './VideoPerfPage';
import StabilityTab from './StabilityTab';

type TabId = 'status' | 'stability' | 'video' | 'audit' | 'tools' | 'settings';

function relTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HealthPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const [params, setParams] = useSearchParams();

  const requested = (params.get('tab') as TabId | null) ?? (can.manageAdmins ? 'status' : 'settings');
  const initial: TabId = can.manageAdmins ? requested : 'settings';
  const [tab, setTab] = useState<TabId>(initial);

  useEffect(() => {
    if (!can.manageAdmins && tab !== 'settings') setTab('settings');
  }, [can.manageAdmins, tab]);

  const tabs: SectionTab[] = can.manageAdmins
    ? [
        { id: 'status',    label: 'Status' },
        { id: 'stability', label: 'Stability' },
        { id: 'video',     label: 'Video' },
        { id: 'audit',     label: 'Audit' },
        { id: 'tools',     label: 'Tools' },
        { id: 'settings',  label: 'Settings' },
      ]
    : [{ id: 'settings', label: 'Settings' }];

  const onTab = (id: string) => {
    setTab(id as TabId);
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const dashboard = useDashboard();
  const eg = dashboard.egSyncHealth;
  const errors = useErrorCount24h();

  const echoChip = useMemo(() => computeEchoChip(echo), [echo.isLoading, echo.isError, echo.data]);
  const pushChip = useMemo(() => computePushChip(push), [push.isLoading, push.isError, push.data]);
  const egChip   = useMemo(() => computeEgChip(eg),   [eg.isLoading, eg.isError, eg.data]);
  const cronChip = useMemo(() => computeCronChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const errorsChip = useMemo(
    () => computeErrorsChip(errors.data ?? null, errors.isLoading, errors.isError),
    [errors.data, errors.isLoading, errors.isError],
  );

  const anyLoading = echo.isLoading || push.isLoading || eg.isLoading || errors.isLoading;
  const nonOk = [echoChip, pushChip, egChip, cronChip, errorsChip].filter(c => c.tone !== 'ok' && c.tone !== 'idle').length;

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1024, margin: '0 auto' }}>
      {!anyLoading && can.manageAdmins && (
        <VerdictRow nonOk={nonOk} />
      )}

      <SectionTabs tabs={tabs} activeId={tab} onChange={onTab} />

      {tab === 'status' && can.manageAdmins && (
        <StatusTab
          echo={echo} push={push} eg={eg}
          echoChip={echoChip} pushChip={pushChip} egChip={egChip} cronChip={cronChip}
        />
      )}
      {tab === 'stability' && can.manageAdmins && <StabilityTab />}
      {tab === 'video' && can.manageAdmins && <VideoPerfPage />}
      {tab === 'audit' && can.manageAdmins && <AuditLogTab />}
      {tab === 'tools' && can.manageAdmins && <DevToolsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

function VerdictRow({ nonOk }: { nonOk: number }) {
  const ok = nonOk === 0;
  const bg = ok ? t.okSoft : t.warnSoft;
  const fg = ok ? t.okText : t.warnText;
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  const label = ok ? 'All systems go' : `${nonOk} system${nonOk === 1 ? '' : 's'} degraded`;
  return (
    <div style={{
      display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8,
      padding: '6px 12px', borderRadius: 999, background: bg, color: fg,
      fontSize: 12, fontWeight: 700,
    }}>
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );
}

// ─── Status tab ───────────────────────────────────────────────────────────────

function StatusTab({
  echo, push, eg, echoChip, pushChip, egChip, cronChip,
}: {
  echo: ReturnType<typeof useEchoEngineHealth>;
  push: ReturnType<typeof usePushHealth>;
  eg:   ReturnType<typeof useDashboard>['egSyncHealth'];
  echoChip: ChipState; pushChip: ChipState; egChip: ChipState; cronChip: ChipState;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EgSyncCard eg={eg} chip={egChip} />
      <CronCard eg={eg} chip={cronChip} />
      <EchoCard echo={echo} chip={echoChip} />
      <PushCard push={push} chip={pushChip} />
    </div>
  );
}

// ─── Shared card primitives ───────────────────────────────────────────────────

const CHIP_TINT: Record<ChipState['tone'], { bg: string; fg: string }> = {
  ok:    { bg: t.okSoft, fg: t.okText },
  warn:  { bg: t.warnSoft, fg: t.warnText },
  danger:{ bg: t.dangerSoft, fg: t.dangerText },
  idle:  { bg: t.neutralSoft, fg: t.inkMuted },
};

function StatusPill({ chip }: { chip: ChipState }) {
  const tint = CHIP_TINT[chip.tone];
  const label =
    chip.tone === 'ok' ? 'Healthy' :
    chip.tone === 'warn' ? 'Needs attention' :
    chip.tone === 'danger' ? 'Failing' : 'Idle';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: tint.bg, color: tint.fg,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 999,
        background: chip.tone === 'ok' ? t.ok : chip.tone === 'warn' ? t.warn : chip.tone === 'danger' ? t.danger : t.inkFaint,
      }} />
      {label}
    </span>
  );
}

function SystemCard({
  icon, title, chip, children, footer,
}: {
  icon: React.ReactNode; title: string; chip: ChipState;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  const tint = CHIP_TINT[chip.tone];
  return (
    <section style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: 18, boxShadow: t.shadowCard,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden style={{
            width: 32, height: 32, borderRadius: '34%',
            background: tint.bg, color: tint.fg,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0, color: t.ink, fontSize: 14.5, fontWeight: 700 }}>{title}</div>
          <StatusPill chip={chip} />
        </div>
        {children}
      </div>
      {footer}
    </section>
  );
}

function StatGrid({ stats }: { stats: Array<{ label: string; value: React.ReactNode; bad?: boolean }> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: t.canvas, border: `1px solid ${t.line}`,
          borderRadius: t.radius.md, padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ color: t.inkFaint, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {s.label}
          </div>
          <div style={{
            color: s.bad ? t.dangerText : t.ink,
            fontSize: 17, fontWeight: 700, lineHeight: 1.1,
            fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function CardFooterButton({
  to, onClick, tone, icon, children,
}: {
  to?: string; onClick?: () => void; tone: 'brand' | 'danger';
  icon: React.ReactNode; children: React.ReactNode;
}) {
  const bg = tone === 'danger' ? t.dangerSoft : t.brandSoft;
  const fg = tone === 'danger' ? t.dangerText : t.warnText;
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 16px', background: bg, color: fg,
    fontSize: 13, fontWeight: 700,
    borderTop: `1px solid ${t.line}`, border: 'none',
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
    textDecoration: 'none', cursor: 'pointer', width: '100%',
  };
  if (to) return <Link to={to} style={style}>{icon}{children}</Link>;
  return <button type="button" onClick={onClick} style={style}>{icon}{children}</button>;
}

function CardSkeleton() {
  return (
    <div style={{ height: 90, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
  );
}

// ─── EG sync card ─────────────────────────────────────────────────────────────

function EgSyncCard({ eg, chip }: { eg: ReturnType<typeof useDashboard>['egSyncHealth']; chip: ChipState }) {
  const d: any = eg.data;
  return (
    <SystemCard
      icon={<Radio size={16} />}
      title="England Golf sync"
      chip={chip}
      footer={d && d.auth_failed > 0 ? (
        <CardFooterButton to="/admin-v2/users?filter=eg_issues" tone="brand" icon={<ChevronDown size={0} style={{ display: 'none' }} />}>
          View affected members

        </CardFooterButton>
      ) : undefined}
    >
      {eg.isLoading ? <CardSkeleton /> : eg.isError || !d ? (
        <AdminErrorState message="Could not load EG sync." onRetry={() => window.dispatchEvent(new CustomEvent("admin-v2:refetch"))} />
      ) : (
        <StatGrid stats={[
          { label: 'Connected',   value: d.total_connected ?? 0 },
          { label: 'OK',          value: d.status_ok_count ?? 0 },
          { label: 'Re-auth',     value: d.auth_failed ?? 0, bad: (d.auth_failed ?? 0) > 0 },
          { label: 'Unavailable', value: d.eg_unavailable ?? 0, bad: (d.eg_unavailable ?? 0) > 0 },
          { label: 'Consec fails', value: d.consecutive_failures_total ?? 0, bad: (d.consecutive_failures_total ?? 0) > 2 },
          { label: 'Last attempt', value: relTime(d.last_attempt_at) },
        ]} />
      )}
    </SystemCard>
  );
}

// ─── Cron card ────────────────────────────────────────────────────────────────

function CronCard({ eg, chip }: { eg: ReturnType<typeof useDashboard>['egSyncHealth']; chip: ChipState }) {
  const d: any = eg.data;
  const hours = d?.cron_hours_ago;
  return (
    <SystemCard icon={<RefreshCw size={16} />} title="Sync cron" chip={chip}>
      {eg.isLoading ? <CardSkeleton /> : eg.isError || !d ? (
        <AdminErrorState message="Could not load cron status." onRetry={() => window.dispatchEvent(new CustomEvent("admin-v2:refetch"))} />
      ) : (
        <StatGrid stats={[
          {
            label: 'Last run',
            value: hours == null ? '-' : `${Math.round(hours)}h ago`,
            bad: hours == null || hours > 26,
          },
          { label: 'Last status', value: String(d.cron_last_status ?? '-').toLowerCase() },
        ]} />
      )}
    </SystemCard>
  );
}

// ─── Echo card ────────────────────────────────────────────────────────────────

const ECHO_LABELS: Record<string, string> = { claude: 'Claude', openai: 'GPT', gemini: 'Gemini', perplexity: 'Perplexity' };

function EchoCard({ echo, chip }: { echo: ReturnType<typeof useEchoEngineHealth>; chip: ChipState }) {
  const latest = echo.data?.latest ?? [];
  const recent = echo.data?.recent ?? [];
  const ok = latest.filter(r => r.ok).length;
  const total = latest.length;
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const onRun = async () => {
    setRunning(true); setRunErr(null);
    try { await echo.runCheck(); }
    catch (e: any) { setRunErr(e?.message || 'Check failed'); }
    finally { setRunning(false); }
  };

  const visible = expanded ? recent : recent.slice(0, 5);

  return (
    <SystemCard
      icon={<Zap size={16} />}
      title="Echo engines"
      chip={chip}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            type="button" onClick={onRun} disabled={running}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 16px', background: t.brandSoft, color: t.warnText,
              fontSize: 13, fontWeight: 700, borderTop: `1px solid ${t.line}`,
              border: 'none', cursor: running ? 'default' : 'pointer', width: '100%',
              opacity: running ? 0.7 : 1,
            }}
          >
            <Play size={14} />
            {running ? 'Running check...' : 'Run a check now'}
          </button>
          {runErr ? (
            <div style={{ padding: '8px 16px', color: t.dangerText, fontSize: 12, borderTop: `1px solid ${t.line}` }}>
              {runErr}
            </div>
          ) : null}
        </div>
      }
    >
      {echo.isLoading ? <CardSkeleton /> : echo.isError ? (
        <AdminErrorState message="Could not load engine health." onRetry={() => echo.refetch()} />
      ) : (
        <>
          <StatGrid stats={[
            { label: 'Engines OK', value: `${ok}/${total || '-'}`, bad: total > 0 && ok < total },
            { label: 'Last check', value: relTime(latest[0]?.checked_at) },
          ]} />
          {recent.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
              <div style={{ color: t.inkFaint, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '8px 0 4px' }}>
                Recent checks
              </div>
              {visible.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: r.ok ? t.ok : t.danger, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, color: t.ink, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ECHO_LABELS[r.engine] ?? r.engine}
                  </span>
                  <span style={{ color: t.inkMuted, fontSize: 11, fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums' }}>
                    {r.ms != null ? `${r.ms}ms` : '-'}
                  </span>
                  <span style={{ color: t.inkFaint, fontSize: 11 }}>{relTime(r.checked_at)}</span>
                </div>
              ))}
              {recent.length > 5 && (
                <button
                  type="button" onClick={() => setExpanded(e => !e)}
                  style={{
                    marginTop: 8, alignSelf: 'flex-start',
                    background: 'transparent', border: 'none', padding: 0,
                    color: t.brandText, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expanded ? 'Hide checks' : 'View all checks'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </SystemCard>
  );
}

// ─── Push card ────────────────────────────────────────────────────────────────

function PushCard({ push, chip }: { push: ReturnType<typeof usePushHealth>; chip: ChipState }) {
  const d = push.data;
  const errors = d?.queue.errored_24h ?? 0;
  const [showErrors, setShowErrors] = useState(false);

  return (
    <SystemCard
      icon={<Bell size={16} />}
      title="Push delivery"
      chip={chip}
      footer={errors > 0 ? (
        <button
          type="button" onClick={() => setShowErrors(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 16px', background: t.dangerSoft, color: t.dangerText,
            fontSize: 13, fontWeight: 700, borderTop: `1px solid ${t.line}`,
            border: 'none', cursor: 'pointer', width: '100%',
          }}
        >
          {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showErrors ? 'Hide error log' : 'View error log'}
        </button>
      ) : undefined}
    >
      {push.isLoading ? <CardSkeleton /> : push.isError || !d ? (
        <AdminErrorState message="Could not load push health." onRetry={() => push.refetch()} />
      ) : (
        <>
          <WatchdogRow wd={d.watchdog} />
          <StatGrid stats={[
            { label: 'Sent 24h', value: d.queue.sent_24h.toLocaleString() },
            { label: 'Errors',   value: errors.toLocaleString(), bad: errors > 0 },
            { label: 'Pending',  value: d.queue.pending_now.toLocaleString(), bad: d.queue.pending_now > 5 },
            { label: 'p50',      value: d.queue.latency_p50_ms != null ? `${Math.round(d.queue.latency_p50_ms)}ms` : '-' },
          ]} />

          {showErrors && d.queue.error_breakdown_24h.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              background: t.canvas, border: `1px solid ${t.line}`, borderRadius: t.radius.md, padding: 8, marginTop: 4,
            }}>
              {d.queue.error_breakdown_24h.map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '6px 4px', borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                }}>
                  <span style={{ color: t.ink, fontSize: 12, minWidth: 0, wordBreak: 'break-word' }}>{row.error}</span>
                  <span style={{ color: t.inkMuted, fontSize: 12, fontWeight: 700, fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {row.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {d.volume_7d_by_type.length > 0 && (() => {
            const max = Math.max(...d.volume_7d_by_type.map(r => r.count), 1);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ color: t.inkFaint, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  Sent by type (7d)
                </div>
                {d.volume_7d_by_type.map((r) => {
                  const pct = Math.max(2, Math.round((r.count / max) * 100));
                  return (
                    <div key={r.type} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: t.ink, fontWeight: 600 }}>{r.type}</span>
                        <span style={{ color: t.inkMuted, fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums' }}>{r.count.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 6, background: t.canvas, borderRadius: 999, border: `1px solid ${t.line}`, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: t.brand }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}
    </SystemCard>
  );
}

// ─── Push enqueue watchdog row ────────────────────────────────────────────────

function WatchdogRow({
  wd,
}: {
  wd: {
    notifications_60m_push_eligible: number;
    queue_rows_60m: number;
    missing_60m: number;
    enqueue_ok: boolean;
    latest_error: string | null;
    latest_error_at: string | null;
  };
}) {
  const bad = wd.enqueue_ok === false;
  const warn = !bad && wd.missing_60m > 0;
  const countColor = bad ? t.dangerText : warn ? t.warnText : t.ink;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '10px 12px',
      background: bad ? t.dangerSoft : warn ? t.warnSoft : t.canvas,
      border: `1px solid ${t.line}`, borderRadius: t.radius.md,
    }}>
      <div style={{ color: t.inkFaint, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        Enqueue watchdog (last 60m)
      </div>
      <div style={{ color: t.ink, fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
        Queued{' '}
        <span style={{
          color: countColor, fontWeight: 700,
          fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
        }}>
          {wd.queue_rows_60m}
        </span>
        {' of '}
        <span style={{
          color: t.ink, fontWeight: 700,
          fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
        }}>
          {wd.notifications_60m_push_eligible}
        </span>
        {' notifications in the last hour'}
      </div>
      {wd.latest_error ? (
        <div style={{ color: t.dangerText, fontSize: 12, fontWeight: 600, wordBreak: 'break-word' }}>
          Last enqueue error: {wd.latest_error}
        </div>
      ) : null}
    </div>
  );
}
