import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { adminTheme as t } from '../theme';
import SectionTabs, { type SectionTab } from '../components/SectionTabs';
import AdminErrorState from '../components/AdminErrorState';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
import { useOpsHealth, type OpsHealth } from '../hooks/useOpsHealth';
import { useDeletionIntegrity } from '../hooks/useDeletionIntegrity';
import {
  computeEchoChip, computePushChip, computeEgChip, computeCronChip,
  computeErrorsChip, computeDeletionChip, toneColor,
  type ChipState,
} from '../lib/healthChips';
import { pipelineTone, PIPELINE_EXPLAINER } from '../components/SystemPanels';
import { formatDurationShort, Skeleton } from '../lib/chartPrimitives';
import {
  useSystemStateHistory, trailingRun,
  type SystemDayState,
} from '../hooks/useSystemStateHistory';
import { useErrorCount24h } from '../hooks/useStability';
import { AuditLogTab, DevToolsTab, SettingsTab } from './SystemPage';
import VideoPerfPage from './VideoPerfPage';
import StabilityTab from './StabilityTab';

type TabId = 'status' | 'stability' | 'video' | 'audit' | 'tools' | 'settings';
type SubsystemId = 'eg' | 'cron' | 'echo' | 'push' | 'pipeline' | 'errors' | 'deletion';

/**
 * ONE duration formatter for the console. chartPrimitives' thresholds (s / m /
 * h up to 48h / d) match what this page needed, so the local date-fns-prose
 * relTime is gone rather than reimplemented a third time.
 */
function age(iso: string | null | undefined): string {
  if (!iso) return '-';
  const secs = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(secs)) return '-';
  return formatDurationShort(Math.max(0, secs));
}

const FIG: React.CSSProperties = {
  fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1',
  fontVariantNumeric: 'tabular-nums',
};

const LABEL: React.CSSProperties = {
  color: t.inkFaint,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
};

const PANEL: React.CSSProperties = {
  background: t.surface,
  border: `1px solid ${t.line}`,
  borderRadius: 18,
  boxShadow: t.shadowCard,
  display: 'flex',
  flexDirection: 'column',
};

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
  const ops = useOpsHealth(7);
  const deletion = useDeletionIntegrity();

  const echoChip = useMemo(() => computeEchoChip(echo), [echo.isLoading, echo.isError, echo.data]);
  const pushChip = useMemo(() => computePushChip(push), [push.isLoading, push.isError, push.data]);
  const egChip   = useMemo(() => computeEgChip(eg),   [eg.isLoading, eg.isError, eg.data]);
  const cronChip = useMemo(() => computeCronChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const errorsChip = useMemo(
    () => computeErrorsChip(errors.data ?? null, errors.isLoading, errors.isError),
    [errors.data, errors.isLoading, errors.isError],
  );
  const deletionChip = useMemo(
    () => computeDeletionChip(deletion.data ?? null, deletion.isLoading),
    [deletion.data, deletion.isLoading],
  );

  /**
   * ONE array. nonOk and the board are derived from the same list, which is
   * why the banner can no longer name a count the page does not render: the
   * old code counted five chips and rendered four cards, and Errors - the one
   * that was degraded - had no card at all.
   */
  const subsystems: Subsystem[] = useMemo(() => {
    const p = ops.data?.pipeline;
    const pTone = ops.isLoading ? 'idle' : pipelineTone(p);
    const e = ops.data?.errors;

    return [
      { id: 'eg',   label: 'EG sync',  chip: egChip,
        headline: eg.data ? `${eg.data.status_ok_count}/${eg.data.total_connected}` : '-' },
      { id: 'cron', label: 'Cron',     chip: cronChip,
        headline: eg.data?.cron_hours_ago == null ? 'stale' : `${Math.round(eg.data.cron_hours_ago)}h` },
      { id: 'echo', label: 'Echo',     chip: echoChip,
        headline: echo.data?.latest?.length
          ? `${echo.data.latest.filter(r => r.ok).length}/${echo.data.latest.length}`
          : '-' },
      { id: 'push', label: 'Push',     chip: pushChip,
        headline: push.data ? push.data.queue.pending_now.toLocaleString() : '-' },
      { id: 'pipeline', label: 'Pipeline',
        chip: { tone: pTone, label: 'Pipeline', detail: p ? `oldest ${formatDurationShort(p.oldest_wait_sec)}` : 'Loading' },
        headline: p ? `${p.unprocessed.toLocaleString()} waiting` : '-' },
      { id: 'errors', label: 'Errors', chip: errorsChip,
        headline: e ? e.errors_24h.toLocaleString() : (errors.data != null ? String(errors.data) : '-') },
      /* BRIEF_HEALTH_DELETION_INTEGRITY - seventh, last. The headline is the
         urgent figure: live logins when any, else contained-not-erased,
         else 0. It should read 0 forever; that is the point. */
      { id: 'deletion', label: 'Deletions', chip: deletionChip,
        headline: deletion.data
          ? String(deletion.data.live_sessions > 0
              ? deletion.data.live_sessions
              : deletion.data.unbanned > 0
              ? deletion.data.unbanned
              : 0)
          : '-' },
    ];
  }, [egChip, cronChip, echoChip, pushChip, errorsChip, deletionChip, eg.data, echo.data, push.data, ops.data, ops.isLoading, errors.data, deletion.data, deletion.isLoading]);

  const anyLoading = echo.isLoading || push.isLoading || eg.isLoading || errors.isLoading || ops.isLoading || deletion.isLoading;
  const degraded = subsystems.filter(s => s.chip.tone !== 'ok' && s.chip.tone !== 'idle');

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1024, margin: '0 auto' }}>
      {!anyLoading && can.manageAdmins && <VerdictRow degraded={degraded} />}

      <SectionTabs tabs={tabs} activeId={tab} onChange={onTab} />

      {tab === 'status' && can.manageAdmins && (
        <StatusTab
          subsystems={subsystems}
          echo={echo} push={push} eg={eg} ops={ops} deletion={deletion}
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

interface Subsystem {
  id: SubsystemId;
  label: string;
  chip: ChipState;
  headline: string;
}

/**
 * A count without names is not a monitor. The tinted capsule went with it:
 * state is a dot, not a background.
 */
function VerdictRow({ degraded }: { degraded: Subsystem[] }) {
  const ok = degraded.length === 0;
  const tone = degraded.some(d => d.chip.tone === 'danger') ? 'danger' : ok ? 'ok' : 'warn';
  return (
    <div style={{ ...PANEL, padding: '12px 14px', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{
          width: 7, height: 7, borderRadius: 999,
          background: toneColor(tone as any), opacity: ok ? 0.5 : 1, flexShrink: 0,
        }} />
        <span style={{ color: t.ink, fontSize: 13, fontWeight: 700 }}>
          {ok ? 'All systems normal' : `${degraded.length} system${degraded.length === 1 ? '' : 's'} degraded`}
        </span>
      </div>
      {!ok && (
        <div style={{ color: t.inkMuted, fontSize: 12, fontWeight: 600, paddingLeft: 15 }}>
          {degraded.map(d => `${d.label} - ${d.chip.detail}`).join(' · ')}
        </div>
      )}
    </div>
  );
}

// ─── Status tab: the board ────────────────────────────────────────────────────

function StatusTab({
  subsystems, echo, push, eg, ops, deletion,
}: {
  subsystems: Subsystem[];
  echo: ReturnType<typeof useEchoEngineHealth>;
  push: ReturnType<typeof usePushHealth>;
  eg:   ReturnType<typeof useDashboard>['egSyncHealth'];
  ops:  ReturnType<typeof useOpsHealth>;
  deletion: ReturnType<typeof useDeletionIntegrity>;
}) {
  // Nothing is auto-selected, not even a degraded subsystem: an admin who
  // arrives to check one thing should not have the page choose for them.
  const [selected, setSelected] = useState<SubsystemId | null>(null);
  const active = subsystems.find(s => s.id === selected) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {subsystems.map(s => (
          <Tile
            key={s.id}
            sub={s}
            active={s.id === selected}
            onClick={() => setSelected(cur => (cur === s.id ? null : s.id))}
          />
        ))}
      </div>

      {active ? (
        <section style={PANEL}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden style={{
                width: 7, height: 7, borderRadius: 999,
                background: toneColor(active.chip.tone), opacity: active.chip.tone === 'ok' ? 0.5 : 1,
              }} />
              <div style={{ flex: 1, minWidth: 0, color: t.ink, fontSize: 14.5, fontWeight: 700 }}>
                {DETAIL_TITLE[active.id]}
              </div>
              <span style={{ color: t.inkMuted, fontSize: 12, fontWeight: 600 }}>{active.chip.detail}</span>
            </div>
            <DetailBody id={active.id} echo={echo} push={push} eg={eg} ops={ops} deletion={deletion} />
          </div>
          <DetailFooter id={active.id} echo={echo} eg={eg} />
        </section>
      ) : (
        <section style={{ ...PANEL, padding: '4px 14px' }}>
          {subsystems.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '11px 0', textAlign: 'left',
                borderTop: i === 0 ? 'none' : `1px solid ${t.hairline}`,
              }}
            >
              <span aria-hidden style={{
                width: 7, height: 7, borderRadius: 999, flexShrink: 0,
                background: toneColor(s.chip.tone), opacity: s.chip.tone === 'ok' ? 0.5 : 1,
              }} />
              <span style={{ flex: 1, minWidth: 0, color: t.ink, fontSize: 13, fontWeight: 600 }}>
                {DETAIL_TITLE[s.id]}
              </span>
              <span style={{ ...FIG, color: t.ink, fontSize: 13, fontWeight: 700 }}>{s.headline}</span>
            </button>
          ))}
        </section>
      )}

      <AllSystemsPanel subsystems={subsystems} />
      <RecentChangesPanel subsystems={subsystems} />
    </div>
  );
}

// ─── All systems history ──────────────────────────────────────────────────────

/**
 * The theme has no `track` token, so the unrecorded-day fill is named here
 * once: neutralSoft is the console's "nothing here" fill and is what track
 * would have been. NO border, NO stripe - a pattern would compete with warn.
 */
const TRACK = t.neutralSoft;

const KICKER: React.CSSProperties = {
  color: t.inkFaint, fontSize: 9, fontWeight: 700,
  letterSpacing: 0.9, textTransform: 'uppercase',
};

function dayFill(state: SystemDayState): { background: string; opacity: number } {
  if (state === 'ok')     return { background: t.ok,        opacity: 0.5 };
  if (state === 'warn')   return { background: t.warn,      opacity: 1 };
  if (state === 'danger') return { background: t.danger,    opacity: 1 };
  if (state === 'idle')   return { background: t.inkFaint,  opacity: 0.35 };
  return { background: TRACK, opacity: 1 };
}

function AllSystemsPanel({ subsystems }: { subsystems: Subsystem[] }) {
  const history = useSystemStateHistory(90);
  const win = history.data?.window_days ?? 90;

  // A missing series does not collapse the block: the subsystem list is the
  // BOARD's, so a mismatch shows as a subsystem with no history rather than a
  // silently shorter section.
  const byId = new Map((history.data?.systems ?? []).map(s => [s.subsystem, s]));

  return (
    <section style={{ ...PANEL, padding: 16, gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={KICKER}>All systems</span>
        <span style={{ ...LABEL, ...FIG }}>{history.data ? `${win} days` : ''}</span>
      </div>

      {history.isLoading || !history.data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {subsystems.map(s => <Skeleton key={s.id} height={40} radius={4} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {subsystems.map(s => (
            <SystemHistoryBlock key={s.id} label={s.label} series={byId.get(s.id)} windowDays={win} />
          ))}
        </div>
      )}
    </section>
  );
}

function SystemHistoryBlock({
  label, series, windowDays,
}: {
  label: string;
  series?: { recorded_days: number; days: Array<SystemDayState> };
  windowDays: number;
}) {
  const recorded = series?.recorded_days ?? 0;
  const days = series?.days ?? [];
  const run = trailingRun(days);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={LABEL}>{label}</div>

      {recorded < 7 ? (
        // 89 empty segments with one coloured tip reads as a broken chart, not
        // as missing history. The bar starts on its own at 7 recorded days.
        <div style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600, height: 20, display: 'flex', alignItems: 'center' }}>
          {recorded === 0
            ? 'No recording yet'
            : recorded === 1
              ? 'Recording since today'
              : `Recording for ${recorded} days`}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 1, height: 20, alignItems: 'stretch' }}>
            {days.map((d, i) => {
              const f = dayFill(d);
              return (
                <span key={i} aria-hidden style={{
                  flex: 1, minWidth: 0, borderRadius: 1,
                  background: f.background, opacity: f.opacity,
                }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={LABEL}>{windowDays} days ago</span>
            <span style={{ ...LABEL, ...FIG }}>
              {run.state === 'ok' ? `ok for ${run.length}d` : `since ${run.length}d`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Recent changes ───────────────────────────────────────────────────────────

const CHANGE_VERB: Record<'ok' | 'warn' | 'danger' | 'idle', string> = {
  ok: 'Recovered', warn: 'Degraded', danger: 'Down', idle: 'Idle',
};

function RecentChangesPanel({ subsystems }: { subsystems: Subsystem[] }) {
  const history = useSystemStateHistory(90);
  const labels = new Map(subsystems.map(s => [s.id as string, s.label]));
  const changes = history.data?.changes ?? [];

  return (
    <section style={{ ...PANEL, padding: 16, gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={KICKER}>Recent changes</span>
        <span style={LABEL}>Last 30 days</span>
      </div>

      {history.isLoading || !history.data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={34} radius={4} />
          <Skeleton height={34} radius={4} />
          <Skeleton height={34} radius={4} />
        </div>
      ) : changes.length === 0 ? (
        // An absence of incidents is information. The panel does not hide.
        <div style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600 }}>No changes in 30 days</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {changes.map((c, i) => (
            <div key={`${c.subsystem}-${c.at}-${i}`} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.hairline}`,
            }}>
              <span aria-hidden style={{
                width: 7, height: 7, borderRadius: 999, marginTop: 4, flexShrink: 0,
                background: toneColor(c.tone), opacity: c.tone === 'ok' ? 0.5 : c.tone === 'idle' ? 0.3 : 1,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={LABEL}>{labels.get(c.subsystem) ?? c.subsystem}</span>
                  <span style={{
                    ...LABEL,
                    color: c.tone === 'ok' ? t.okText : c.tone === 'warn' ? t.warnText : c.tone === 'danger' ? t.dangerText : t.inkFaint,
                  }}>{CHANGE_VERB[c.tone]}</span>
                </div>
                {c.detail ? (
                  <div style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600 }}>{c.detail}</div>
                ) : null}
              </div>
              <span style={{ ...FIG, color: t.inkFaint, fontSize: 11, flexShrink: 0 }}>{age(c.at)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


const DETAIL_TITLE: Record<SubsystemId, string> = {
  eg: 'England Golf sync',
  cron: 'Sync cron',
  echo: 'Echo engines',
  push: 'Push delivery',
  pipeline: 'Evaluation pipeline',
  errors: 'Client errors',
  deletion: 'Deleted accounts',
};

/**
 * The cap is the state. At ok it sits at 0.5 opacity so the one subsystem that
 * is NOT ok is what the eye finds first; idle sits at 0.3.
 */
function Tile({ sub, active, onClick }: { sub: Subsystem; active: boolean; onClick: () => void }) {
  const tone = sub.chip.tone;
  const color = toneColor(tone);
  const opacity = tone === 'ok' ? 0.5 : tone === 'idle' ? 0.3 : 1;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...PANEL,
        padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
        border: `1px solid ${active ? t.inkFaint : t.line}`,
      }}
    >
      <span aria-hidden style={{ display: 'block', height: 2.5, background: color, opacity }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 10px 12px' }}>
        <span style={{ ...LABEL, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub.label}
        </span>
        <span style={{
          ...FIG, fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em',
          color: tone === 'ok' || tone === 'idle' ? t.ink : color,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {sub.headline}
        </span>
      </span>
    </button>
  );
}

// ─── Boxless stats: alignment separates, not borders ──────────────────────────

function StatRow({ stats }: { stats: Array<{ label: string; value: React.ReactNode; bad?: boolean }> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px' }}>
      {stats.map((s, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 64 }}>
          <div style={LABEL}>{s.label}</div>
          <div style={{
            ...FIG, color: s.bad ? t.dangerText : t.ink,
            fontSize: 17, fontWeight: 700, lineHeight: 1.1,
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div style={{ height: 90, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
  );
}

const FOOTER_BTN: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '12px 16px', background: 'transparent', color: t.brandText,
  fontSize: 13, fontWeight: 700,
  borderTop: `1px solid ${t.line}`, border: 'none',
  borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
  textDecoration: 'none', cursor: 'pointer', width: '100%',
};

function DetailFooter({
  id, echo, eg,
}: {
  id: SubsystemId;
  echo: ReturnType<typeof useEchoEngineHealth>;
  eg: ReturnType<typeof useDashboard>['egSyncHealth'];
}) {
  if (id === 'eg') {
    const d: any = eg.data;
    if (!d || (d.auth_failed ?? 0) === 0) return null;
    return (
      <Link to="/admin-v2/users?filter=eg_issues" style={{ ...FOOTER_BTN, borderTop: `1px solid ${t.line}` }}>
        View affected members
      </Link>
    );
  }
  if (id === 'echo') return <EchoRunFooter echo={echo} />;
  if (id === 'errors') {
    return (
      <Link to="/admin-v2/health?tab=stability" style={{ ...FOOTER_BTN, borderTop: `1px solid ${t.line}` }}>
        Open stability
      </Link>
    );
  }
  return null;
}

function EchoRunFooter({ echo }: { echo: ReturnType<typeof useEchoEngineHealth> }) {
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState<string | null>(null);
  const onRun = async () => {
    setRunning(true); setRunErr(null);
    try { await echo.runCheck(); }
    catch (e: any) { setRunErr(e?.message || 'Check failed'); }
    finally { setRunning(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        type="button" onClick={onRun} disabled={running}
        style={{ ...FOOTER_BTN, borderTop: `1px solid ${t.line}`, opacity: running ? 0.7 : 1, cursor: running ? 'default' : 'pointer' }}
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
  );
}

function DetailBody({
  id, echo, push, eg, ops, deletion,
}: {
  id: SubsystemId;
  echo: ReturnType<typeof useEchoEngineHealth>;
  push: ReturnType<typeof usePushHealth>;
  eg:   ReturnType<typeof useDashboard>['egSyncHealth'];
  ops:  ReturnType<typeof useOpsHealth>;
  deletion: ReturnType<typeof useDeletionIntegrity>;
}) {
  if (id === 'eg')       return <EgSyncDetail eg={eg} />;
  if (id === 'cron')     return <CronDetail eg={eg} />;
  if (id === 'echo')     return <EchoDetail echo={echo} />;
  if (id === 'push')     return <PushDetail push={push} />;
  if (id === 'pipeline') return <PipelineDetail ops={ops} />;
  if (id === 'deletion') return <DeletionDetail deletion={deletion} />;
  return <ErrorsDetail ops={ops} />;
}

// ─── Deletions ────────────────────────────────────────────────────────────────

/**
 * BRIEF_HEALTH_DELETION_INTEGRITY §5. Counts in plain words, never the
 * column names; worst_seen rendered as an age. NO account is ever named -
 * the count is the alert; identifying accounts is a SQL job for Ben, and
 * user ids on an admin board invite action outside the erasure flow.
 */
function DeletionDetail({ deletion }: { deletion: ReturnType<typeof useDeletionIntegrity> }) {
  const d = deletion.data;
  if (deletion.isLoading) return <CardSkeleton />;
  if (!d) return <AdminErrorState message="Could not load deletion integrity." onRetry={() => deletion.refetch()} />;
  return (
    <>
      <StatRow stats={[
        { label: 'Still signed in', value: d.live_sessions, bad: d.live_sessions > 0 },
        { label: 'Contained, not erased', value: d.unbanned, bad: d.unbanned > 0 },
        { label: 'Fully erased', value: d.orphan_profiles },
        ...(d.worst_seen ? [{ label: 'Oldest unresolved', value: age(d.worst_seen), bad: true }] : []),
      ]} />
      {d.live_sessions > 0 && (
        <div style={{ color: t.dangerText, fontSize: 12, fontWeight: 600 }}>
          A deleted account can currently sign in and write to the app.
        </div>
      )}
    </>
  );
}

// ─── EG sync ──────────────────────────────────────────────────────────────────

function EgSyncDetail({ eg }: { eg: ReturnType<typeof useDashboard>['egSyncHealth'] }) {
  const d: any = eg.data;
  if (eg.isLoading) return <CardSkeleton />;
  if (eg.isError || !d) {
    return <AdminErrorState message="Could not load EG sync." onRetry={() => window.dispatchEvent(new CustomEvent('admin-v2:refetch'))} />;
  }
  return (
    <StatRow stats={[
      { label: 'Connected',   value: d.total_connected ?? 0 },
      { label: 'OK',          value: d.status_ok_count ?? 0 },
      { label: 'Re-auth',     value: d.auth_failed ?? 0, bad: (d.auth_failed ?? 0) > 0 },
      { label: 'Unavailable', value: d.eg_unavailable ?? 0, bad: (d.eg_unavailable ?? 0) > 0 },
      { label: 'Consec fails', value: d.consecutive_failures_total ?? 0, bad: (d.consecutive_failures_total ?? 0) > 2 },
      { label: 'Freshest',    value: age(d.freshest_sync_at ?? d.last_attempt_at),
        bad: d.freshest_hours_ago == null || d.freshest_hours_ago > 12 },
      { label: 'Stale >12h',  value: d.stale_12h_count ?? 0, bad: (d.stale_12h_count ?? 0) > 0 },
      { label: 'Poisoned',    value: d.poisoned_count ?? 0, bad: (d.poisoned_count ?? 0) > 0 },
    ]} />
  );
}

// ─── Cron ─────────────────────────────────────────────────────────────────────

function CronDetail({ eg }: { eg: ReturnType<typeof useDashboard>['egSyncHealth'] }) {
  const d: any = eg.data;
  if (eg.isLoading) return <CardSkeleton />;
  if (eg.isError || !d) {
    return <AdminErrorState message="Could not load cron status." onRetry={() => window.dispatchEvent(new CustomEvent('admin-v2:refetch'))} />;
  }
  const hours = d.cron_hours_ago;
  return (
    <StatRow stats={[
      { label: 'Last run', value: hours == null ? '-' : `${Math.round(hours)}h`, bad: hours == null || hours > 26 },
      { label: 'Last status', value: String(d.cron_last_status ?? '-').toLowerCase() },
    ]} />
  );
}

// ─── Echo ─────────────────────────────────────────────────────────────────────

const ECHO_LABELS: Record<string, string> = { claude: 'Claude', openai: 'GPT', gemini: 'Gemini', perplexity: 'Perplexity' };

function EchoDetail({ echo }: { echo: ReturnType<typeof useEchoEngineHealth> }) {
  const latest = echo.data?.latest ?? [];
  const recent = echo.data?.recent ?? [];
  const ok = latest.filter(r => r.ok).length;
  const total = latest.length;
  const [expanded, setExpanded] = useState(false);

  if (echo.isLoading) return <CardSkeleton />;
  if (echo.isError) return <AdminErrorState message="Could not load engine health." onRetry={() => echo.refetch()} />;

  const visible = expanded ? recent : recent.slice(0, 5);

  return (
    <>
      <StatRow stats={[
        { label: 'Engines OK', value: `${ok}/${total || '-'}`, bad: total > 0 && ok < total },
        { label: 'Last check', value: age(latest[0]?.checked_at) },
      ]} />
      {recent.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...LABEL, padding: '8px 0 4px' }}>Recent checks</div>
          {visible.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.hairline}`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: r.ok ? t.ok : t.danger, opacity: r.ok ? 0.5 : 1, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, color: t.ink, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ECHO_LABELS[r.engine] ?? r.engine}
              </span>
              <span style={{ ...FIG, color: t.inkMuted, fontSize: 11 }}>{r.ms != null ? `${r.ms}ms` : '-'}</span>
              <span style={{ ...FIG, color: t.inkFaint, fontSize: 11 }}>{age(r.checked_at)}</span>
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
  );
}

// ─── Push ─────────────────────────────────────────────────────────────────────

function PushDetail({ push }: { push: ReturnType<typeof usePushHealth> }) {
  const d = push.data;
  const [showErrors, setShowErrors] = useState(false);
  if (push.isLoading) return <CardSkeleton />;
  if (push.isError || !d) return <AdminErrorState message="Could not load push health." onRetry={() => push.refetch()} />;
  const errored = d.queue.errored_24h ?? 0;

  return (
    <>
      <WatchdogRow wd={d.watchdog} />
      <StatRow stats={[
        { label: 'Sent 24h', value: d.queue.sent_24h.toLocaleString() },
        { label: 'Errors',   value: errored.toLocaleString(), bad: errored > 0 },
        { label: 'Pending',  value: d.queue.pending_now.toLocaleString(), bad: d.queue.pending_now > 5 },
        { label: 'p50',      value: d.queue.latency_p50_ms != null ? `${Math.round(d.queue.latency_p50_ms)}ms` : '-' },
      ]} />

      {errored > 0 && d.queue.error_breakdown_24h.length > 0 && (
        <>
          <button
            type="button" onClick={() => setShowErrors(v => !v)}
            style={{
              alignSelf: 'flex-start', background: 'transparent', border: 'none', padding: 0,
              color: t.brandText, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            {showErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showErrors ? 'Hide error log' : 'View error log'}
          </button>
          {showErrors && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {d.queue.error_breakdown_24h.map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
                  padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.hairline}`,
                }}>
                  <span style={{ color: t.ink, fontSize: 12, minWidth: 0, wordBreak: 'break-word' }}>{row.error}</span>
                  <span style={{ ...FIG, color: t.inkMuted, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {row.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {d.volume_7d_by_type.length > 0 && (() => {
        const max = Math.max(...d.volume_7d_by_type.map(r => r.count), 1);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <div style={LABEL}>Sent by type (7d)</div>
            {d.volume_7d_by_type.map((r) => {
              const pct = Math.max(2, Math.round((r.count / max) * 100));
              return (
                <div key={r.type} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: t.ink, fontWeight: 600 }}>{r.type}</span>
                    <span style={{ ...FIG, color: t.inkMuted }}>{r.count.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: t.canvas, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: t.brand }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </>
  );
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

/**
 * gam_evaluation_queue. EG sync green means data ARRIVED, not that it was
 * PROCESSED - if this queue backs up the product silently stops producing
 * while every other tile on the board stays green. Thresholds come from
 * pipelineTone, shared with the Dashboard so the two cannot diverge.
 */
function PipelineDetail({ ops }: { ops: ReturnType<typeof useOpsHealth> }) {
  const p: OpsHealth['pipeline'] | undefined = ops.data?.pipeline;
  if (ops.isLoading) return <CardSkeleton />;
  if (ops.isError || !p) return <AdminErrorState message="Could not load the pipeline." onRetry={() => ops.refetch()} />;

  // Rendered from the keys the RPC actually returned; a status not returned is
  // not a zero, so nothing is hard-coded here.
  const statuses = Object.entries(p.by_status ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <>
      {/* Same sentence as the Dashboard panel, from the same constant. */}
      <div style={{ color: t.inkMuted, fontSize: 11.5 }}>{PIPELINE_EXPLAINER}</div>
      <StatRow stats={[
        { label: 'Waiting', value: p.unprocessed.toLocaleString(), bad: p.unprocessed > 0 && p.oldest_wait_sec >= 3600 },
        { label: 'Oldest wait', value: p.unprocessed > 0 ? formatDurationShort(p.oldest_wait_sec) : '-' },
        { label: 'Median process', value: formatDurationShort(p.median_process_sec) },
        { label: 'Retrying', value: p.retrying.toLocaleString(), bad: p.retrying > 0 },
        { label: 'Errored', value: p.errored.toLocaleString(), bad: p.errored > 0 },
      ]} />
      {statuses.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, borderTop: `1px solid ${t.hairline}`, paddingTop: 10 }}>
          {statuses.map(([k, v]) => (
            <span key={k} style={{ ...LABEL, ...FIG, textTransform: 'none', letterSpacing: 0 }}>
              {titleCase(k)} <span style={{ color: t.ink, fontWeight: 700 }}>{v.toLocaleString()}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/**
 * The subsystem the banner could name and the page could not show. The
 * denominator is MEMBER sessions only, and the label says so, because that is
 * what distinguishes it from the bot-inflated figure the old tile used.
 */
function ErrorsDetail({ ops }: { ops: ReturnType<typeof useOpsHealth> }) {
  const e = ops.data?.errors;
  if (ops.isLoading) return <CardSkeleton />;
  if (ops.isError || !e) return <AdminErrorState message="Could not load errors." onRetry={() => ops.refetch()} />;

  const rate = e.sessions_24h > 0 ? (e.errors_24h / e.sessions_24h) * 100 : null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ ...FIG, color: t.ink, fontSize: 28, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {e.errors_24h.toLocaleString()}
        </div>
        <div style={{ color: t.inkMuted, fontSize: 12, fontWeight: 600 }}>in the last 24 hours, on this build</div>
        {(e.outdated_errors_24h ?? 0) > 0 && (
          <div style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600 }}>
            {e.outdated_errors_24h.toLocaleString()} error{e.outdated_errors_24h === 1 ? '' : 's'} from outdated clients
            {(e.outdated_users_24h ?? 0) > 0
              ? ` · ${e.outdated_users_24h.toLocaleString()} member${e.outdated_users_24h === 1 ? '' : 's'}`
              : ''}
          </div>
        )}
      </div>

      <StatRow stats={[
        { label: 'Members hit', value: e.users_hit_24h.toLocaleString(), bad: e.users_hit_24h > 0 },
        { label: 'Member sessions', value: e.sessions_24h.toLocaleString() },
        // No rate without a denominator: dividing by zero into a dash is a
        // figure that reads as measured.
        ...(rate === null ? [] : [{ label: 'Rate per member session', value: `${rate.toFixed(1)}%`, bad: rate >= 5 }]),
      ]} />

      {e.top.length === 0 ? (
        <div style={{ color: t.inkFaint, fontSize: 12 }}>No errors in the window</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {e.top.slice(0, 3).map((row, i) => (
            <div key={`${row.message}-${i}`} style={{
              display: 'flex', alignItems: 'baseline', gap: 10,
              padding: '9px 0', borderTop: `1px solid ${t.hairline}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: t.ink, fontSize: 13, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{row.message}</div>
                <div style={{ ...LABEL, textTransform: 'none', letterSpacing: 0 }}>
                  {row.kind}{row.route ? ` · ${row.route}` : ''}
                </div>
              </div>
              <span style={{ ...FIG, color: t.ink, fontSize: 13, fontWeight: 700 }}>{row.count.toLocaleString()}</span>
              <span style={{ ...FIG, color: t.inkFaint, fontSize: 11, minWidth: 44, textAlign: 'right' }}>
                {row.users.toLocaleString()} hit
              </span>
            </div>
          ))}
        </div>
      )}
    </>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={LABEL}>Enqueue watchdog (last 60m)</div>
      <div style={{ color: t.ink, fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
        Queued{' '}
        <span style={{ ...FIG, color: countColor, fontWeight: 700 }}>{wd.queue_rows_60m}</span>
        {' of '}
        <span style={{ ...FIG, color: t.ink, fontWeight: 700 }}>{wd.notifications_60m_push_eligible}</span>
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
