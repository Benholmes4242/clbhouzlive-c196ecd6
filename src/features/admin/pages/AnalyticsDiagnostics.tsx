/**
 * Analytics DIAGNOSTICS: ?tab=events and ?tab=auth. Moved verbatim out of
 * AnalyticsPage.tsx by BRIEF_ANALYTICS; behaviour unchanged. Reachable by URL
 * only. Recharts lives here and nowhere else on the Analytics page.
 */
import { formatAgo } from '../lib/formatAgo';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Search, XCircle } from 'lucide-react';
import { adminTheme as t } from '../theme';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import AdminErrorState from '../components/AdminErrorState';
import AdminSheet from '../components/AdminSheet';
import { labelForEvent } from '../lib/eventLabels';
import { useProfilesByIds, type LiteProfile } from '../hooks/useLiveStream';
import {
  useEventAggregates,
  useEventDaily,
  useEventOccurrences,
  useAppErrors,
  useDebounced,
  STOPPED_MIN_COUNT,
  STOPPED_MIN_USERS,

  type EventAggregate,
  type EventSort,
} from '../hooks/useEventsExplorer';
import { type AnalyticsPeriod, useAuthAnalytics } from '../hooks/useAnalytics';

function fmtTick(v: number) { return v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`; }
function fmtInt(n: number) { return n.toLocaleString(); }
/**
 * Returns null when the prior period is 0: "from nothing" has no percentage
 * and returning 100 made it indistinguishable from a genuine doubling.
 * Callers render null as "New". Rounded FIRST, to an INTEGER, so every delta
 * on the page carries the same precision.
 */
function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}


function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.line}`,
      borderRadius: 18,
      boxShadow: t.shadowCard,
      padding: 16,
      ...style,
    }}>{children}</div>
  );
}

/** null delta = no comparable prior period; renders "New", never a percentage. */
function DeltaChip({ delta, unit = '%' }: { delta: number | null; unit?: string }) {
  if (delta === null) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        color: t.inkMuted, background: t.neutralSoft,
        borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700,
      }}>New</span>
    );
  }
  const positive = delta >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      color: positive ? t.okText : t.dangerText,
      background: positive ? t.okSoft : t.dangerSoft,
      borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(delta)}{unit}
    </span>
  );
}


function Headline({
  eyebrow, value, delta, deltaUnit, note, loading,
}: {
  eyebrow: string;
  value: React.ReactNode;
  delta?: number | null;
  deltaUnit?: string;
  note?: string;
  loading?: boolean;
}) {
  return (
    <Card style={{ borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        color: t.inkFaint, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      }}>{eyebrow}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          color: t.ink, fontSize: 38, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {loading ? '-' : value}
        </div>
        {!loading && delta !== undefined && (
          <DeltaChip delta={delta} unit={deltaUnit ?? '%'} />
        )}

      </div>
      {note && (
        <div style={{ color: t.inkMuted, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
          {note}
        </div>
      )}
    </Card>
  );
}


export function AuthTab({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useAuthAnalytics(period);

  const successRate = data?.successRate ?? 0;
  const priorRate = data?.successRatePrior ?? null;
  const delta = (priorRate !== null && data)
    ? Math.round((data.successRate - priorRate) * 10) / 10
    : undefined;

  const failures = data?.totalFailures ?? 0;

  const signupSeries = useMemo(() => {
    if (!data) return [];
    return data.signupSuccessTrend.map((s, i) => ({
      date: s.date,
      success: s.value,
      failure: data.signupFailTrend[i]?.value ?? 0,
    }));
  }, [data]);

  const loginSeries = useMemo(() => {
    if (!data) return [];
    return data.loginSuccessTrend.map((s, i) => ({
      date: s.date,
      success: s.value,
      failure: data.loginFailTrend[i]?.value ?? 0,
    }));
  }, [data]);

  const noSignups = signupSeries.every(d => d.success === 0 && d.failure === 0);
  const noLogins  = loginSeries.every(d => d.success === 0 && d.failure === 0);

  return (
    <>
      <Headline
        eyebrow="Auth success rate"
        value={`${successRate}%`}
        delta={typeof delta === 'number' ? delta : undefined}
        deltaUnit="pt"
        note={`${fmtInt(failures)} failures across signups and logins`}
        loading={isLoading}
      />

      <ChartCard title="Signups" subtitle="Success vs failure" loading={isLoading} isEmpty={!isLoading && noSignups}>
        <AuthStackedBars data={signupSeries} />
      </ChartCard>

      <ChartCard title="Logins" subtitle="Success vs failure" loading={isLoading} isEmpty={!isLoading && noLogins}>
        <AuthStackedBars data={loginSeries} />
      </ChartCard>

      <Card>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Recent auth events</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Latest 20 events in the selected period</div>
        {isLoading ? (
          <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md }} />
        ) : (data?.recentEvents.length ?? 0) === 0 ? (
          <EmptyState title="No auth events yet" subtitle="Events will appear here as members sign up and log in." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data!.recentEvents.map((e, i) => {
              const isLast = i === data!.recentEvents.length - 1;
              const isSignup = e.name === 'signup_success' || e.name === 'signup_failed';
              const label = `${isSignup ? 'Signup' : 'Login'}${e.isFailure ? ' failed' : ''}`;
              const identity = e.userId
                ? (e.displayName || (e.username ? `@${e.username}` : e.userId.slice(0, 8)))
                : (e.email ?? 'Unknown');
              const row = (
                <>
                  <span style={{ display: 'inline-flex', width: 20, justifyContent: 'center' }}>
                    {e.isFailure
                      ? <XCircle size={16} color={t.dangerText} />
                      : <CheckCircle2 size={16} color={t.okText} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: t.ink, fontSize: 13.5, fontWeight: 600 }}>{label}</div>
                    <div style={{
                      color: t.inkMuted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{identity}</div>
                  </div>
                  <span style={{
                    color: t.inkFaint, fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', minWidth: 68,
                  }}>{formatAgo(e.createdAt, { suffix: true, empty: '-' })}</span>
                </>
              );
              const style: React.CSSProperties = {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', textDecoration: 'none',
                borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
              };
              return e.userId
                ? <Link key={e.id} to={`/admin-v2/users?member=${e.userId}`} style={style}>{row}</Link>
                : <div key={e.id} style={style}>{row}</div>;
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function AuthStackedBars({ data }: { data: { date: string; success: number; failure: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
        <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="success" stackId="a" fill={t.ok}     radius={[0, 0, 0, 0]} />
        <Bar dataKey="failure" stackId="a" fill={t.danger} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Keep periodToDays exported symbol used implicitly to avoid TS lint on unused import.
void periodToDays;

// ═══ LIVE TAB (Firebase realtime) ═════════════════════════════════════════════
// - useLiveInApp: shared 5-min distinct-users query (also feeds Dashboard).
// - useLiveWindow30m: 30-min event window that powers the minute chart,
//   the event stream, and the top-screens section (verified `path` prop on
//   page_view via src/hooks/usePageTracking.ts).
// - Both polling queries are visibility-gated in their hook definitions.

function displayNameOf(p?: LiteProfile | null): string {
  if (!p) return 'Member';
  return p.display_name || (p.username ? `@${p.username}` : 'Member');
}

function initialsOf(p?: LiteProfile | null): string {
  const n = p?.display_name || p?.username || '?';
  return (n[0] ?? '?').toUpperCase();
}


function IncludeStaffToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${on ? t.ink : t.line}`,
        background: on ? t.ink : 'transparent',
        color: on ? t.canvas : t.inkMuted,
        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
      }}
      aria-pressed={on}
    >Include staff</button>
  );
}

/**
 * Admin events are OFF by default. They fire only inside the console, so left in
 * the table they read as features no member uses, forever.
 */
function IncludeAdminToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${on ? t.ink : t.line}`,
        background: on ? t.ink : 'transparent',
        color: on ? t.canvas : t.inkMuted,
        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
      }}
      aria-pressed={on}
    >Admin events</button>
  );
}

const EVENT_SORTS: { id: EventSort; label: string }[] = [
  { id: 'count',     label: 'Count' },
  { id: 'users',     label: 'Members' },
  { id: 'last_seen', label: 'Last seen' },
  { id: 'name',      label: 'Name' },
];

export function EventsTab({ period }: { period: AnalyticsPeriod }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<EventSort>('count');
  const [selected, setSelected] = useState<EventAggregate | null>(null);
  const [includeStaff, setIncludeStaff] = useState(false);
  const [includeAdmin, setIncludeAdmin] = useState(false);
  const search = useDebounced(query, 300);
  const { aggregates, page, isLoading, isError, refetch } =
    useEventAggregates(period, { search, sort, includeStaff, includeAdmin });

  return (
    <>
      <Card style={{ borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          color: t.inkFaint, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Events in period</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            color: t.ink, fontSize: 38, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {isLoading ? '-' : fmtInt(page?.windowEvents ?? 0)}
          </div>
          <div style={{ color: t.inkMuted, fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>
            across {fmtInt(page?.distinctNames ?? 0)} distinct events, {fmtInt(page?.windowMembers ?? 0)} members
          </div>
          <IncludeStaffToggle on={includeStaff} onChange={setIncludeStaff} />
          <IncludeAdminToggle on={includeAdmin} onChange={setIncludeAdmin} />
        </div>
        <div style={{ color: t.inkFaint, fontSize: 11.5, lineHeight: 1.5 }}>
          {!!page?.adminNames && (
            <>
              {includeAdmin
                ? `${fmtInt(page.adminNames)} admin-only event${page.adminNames === 1 ? '' : 's'} shown; they fire inside the console only and never raise an alarm.`
                : `${fmtInt(page.adminNames)} admin-only event${page.adminNames === 1 ? '' : 's'} hidden: console surfaces no member can reach.`}
              {' '}
            </>
          )}
          {includeStaff
            ? `Staff included: ${fmtInt(page?.staffEvents ?? 0)} of these events are staff.`
            : `Staff excluded: ${fmtInt(page?.staffEvents ?? 0)} further events came from staff accounts in this period.`}
          {' '}
          {/* Logged-out browsing is real traffic, not measurement loss. Bots are
              blocked at write time, so a null user_id is a visitor without a
              session. Stated here so nobody later reads it as a gap. */}
          {fmtInt(page?.anonEvents ?? 0)} events across {fmtInt(page?.anonSessions ?? 0)} sessions have no member
          attached: logged-out browsing, counted in the total and not a loss.
        </div>
      </Card>

      <AppErrorsCard period={period} />

      {!!page?.stoppedNames && (
        <Card style={{ borderColor: t.danger }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={15} color={t.danger} />
            <div style={{ color: t.ink, fontSize: 13.5, fontWeight: 700 }}>
              {fmtInt(page.stoppedNames)} event{page.stoppedNames === 1 ? '' : 's'} stopped firing
            </div>
          </div>
          <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 4 }}>
            Fired at least {STOPPED_MIN_COUNT} times across {STOPPED_MIN_USERS}+ non-staff members in the previous {page.windowDays} days,
            nothing since. Usually a release broke tracking. Sorted to the top.
            {!!page.silentNames && ` ${fmtInt(page.silentNames)} further event${page.silentNames === 1 ? '' : 's'} quiet but below the alarm floor or retired.`}
          </div>
        </Card>
      )}


      <Card>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: `1px solid ${t.line}`, borderRadius: 999, background: t.canvas,
          padding: '8px 12px', marginBottom: 10,
        }}>
          <Search size={14} color={t.inkMuted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search event name"
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none',
              background: 'transparent', color: t.ink, fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {EVENT_SORTS.map(s => {
            const on = s.id === sort;
            return (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                style={{
                  padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${on ? t.ink : t.line}`,
                  background: on ? t.ink : 'transparent',
                  color: on ? t.canvas : t.inkMuted,
                  fontSize: 12, fontWeight: 700,
                }}
              >{s.label}</button>
            );
          })}
        </div>

        {isError ? (
          <AdminErrorState title="Couldn't load events" onRetry={() => refetch()} />
        ) : isLoading ? (
          <div style={{ height: 260, background: t.canvas, borderRadius: t.radius.md }} />
        ) : aggregates.length === 0 ? (
          <EmptyState title="No events match" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {aggregates.map((a, i) => {
              const isLast = i === aggregates.length - 1;
              return (
                <button
                  key={a.name}
                  onClick={() => setSelected(a)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', width: '100%',
                    background: 'transparent', border: 'none', textAlign: 'left',
                    borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: t.ink, fontSize: 13.5, fontWeight: 700,
                      overflow: 'hidden',
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {labelForEvent(a.name)}
                      </span>
                      {a.stopped && (
                        <span style={{
                          flexShrink: 0, padding: '1px 6px', borderRadius: 999,
                          border: `1px solid ${t.danger}`, color: t.danger,
                          fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>Stopped</span>
                      )}
                      {!a.stopped && a.gapReason && (
                        <span style={{
                          flexShrink: 0, padding: '1px 6px', borderRadius: 999,
                          border: `1px solid ${t.danger}`, color: t.danger,
                          fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>Gap</span>
                      )}
                      {!a.stopped && !a.gapReason && a.retiredReason && (
                        <span style={{
                          flexShrink: 0, padding: '1px 6px', borderRadius: 999,
                          border: `1px solid ${t.line}`, color: t.inkFaint,
                          fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>Retired</span>
                      )}
                      {!a.stopped && !a.retiredReason && a.silent && (
                        <span style={{
                          flexShrink: 0, padding: '1px 6px', borderRadius: 999,
                          border: `1px solid ${t.line}`, color: t.inkMuted,
                          fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
                        }}>Silent</span>
                      )}
                    </div>
                    <div style={{
                      color: t.inkFaint, fontSize: 10.5,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{a.name}{a.lastSeenAt ? ` · last ${formatAgo(a.lastSeenAt, { suffix: true })}` : ''}</div>
                    {a.probableRenameTo && (
                      <div style={{ color: t.inkMuted, fontSize: 10.5, marginTop: 2 }}>
                        Probable rename → <span style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}>{a.probableRenameTo}</span> (heuristic)
                      </div>
                    )}
                    {a.gapReason && (
                      <div style={{ color: t.inkMuted, fontSize: 10.5, marginTop: 2 }}>
                        Instrumentation gap: {a.gapReason}
                      </div>
                    )}
                    {a.retiredReason && (
                      <div style={{ color: t.inkFaint, fontSize: 10.5, marginTop: 2 }}>
                        Retired: {a.retiredReason}
                      </div>
                    )}

                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        color: t.ink, fontSize: 13.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      }}>{fmtInt(a.count)}</div>
                      <div style={{
                        color: t.inkFaint, fontSize: 11, fontVariantNumeric: 'tabular-nums',
                      }}>{fmtInt(a.users)} members</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <DeltaChip delta={a.deltaCountPct} />
                      <DeltaChip delta={a.deltaUsersPct} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <EventDetailSheet
        aggregate={selected}
        period={period}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

// app_error grouped by MESSAGE + BUILD. Grouping it by event name renders the
// most valuable diagnostic on this screen as one useless row — four uncaught
// crashes on real devices went unnoticed for five days on a 99-member platform.
function AppErrorsCard({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading, isError, refetch } = useAppErrors(period);
  const rows = data?.rows ?? [];

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ color: t.ink, fontSize: 14, fontWeight: 700 }}>App errors</div>
        <div style={{ color: t.inkMuted, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          {isLoading ? '-' : `${fmtInt(data?.totalErrors ?? 0)} in ${fmtInt(data?.distinctGroups ?? 0)} groups, ${fmtInt(data?.membersAffected ?? 0)} members`}
        </div>
      </div>
      <div style={{ color: t.inkFaint, fontSize: 11.5, marginTop: 2, marginBottom: 10 }}>
        Grouped by message and build, newest first
      </div>
      {isError ? (
        <AdminErrorState title="Couldn't load app errors" onRetry={() => refetch()} />
      ) : isLoading ? (
        <div style={{ height: 120, background: t.canvas, borderRadius: t.radius.md }} />
      ) : rows.length === 0 ? (
        <EmptyState title="No app errors in this period" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((g, i) => (
            <div
              key={`${g.build}|${g.message}|${i}`}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
                borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.line}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: t.ink, fontSize: 13, fontWeight: 600,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{g.message}</div>
                <div style={{
                  color: t.inkFaint, fontSize: 10.5,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}>{g.build} · last {formatAgo(g.lastSeenAt, { suffix: true })}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  color: t.ink, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                }}>{fmtInt(g.count)}</div>
                <div style={{ color: t.inkFaint, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtInt(g.users)} members
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function EventDetailSheet({
  aggregate, period, onClose,
}: {
  aggregate: EventAggregate | null;
  period: AnalyticsPeriod;
  onClose: () => void;
}) {
  const dailyQ = useEventDaily(aggregate?.name ?? null, period);
  const daily = useMemo(
    () => (dailyQ.data ?? []).map(p => ({
      date: new Date(p.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      value: p.count,
      users: p.users,
    })),
    [dailyQ.data],
  );

  const occ = useEventOccurrences(aggregate?.name ?? null, period);
  const occRows = useMemo(
    () => (occ.data?.pages ?? []).flatMap(p => p.rows),
    [occ.data],
  );
  const ids = useMemo(() => {
    const s = new Set<string>();
    for (const o of occRows) if (o.user_id) s.add(o.user_id);
    return Array.from(s);
  }, [occRows]);
  const profiles = useProfilesByIds(ids);

  const total = aggregate?.count ?? 0;
  const users = aggregate?.users ?? 0;
  const perUser = users > 0 ? Math.round((total / users) * 10) / 10 : 0;

  return (
    <AdminSheet
      open={!!aggregate}
      onClose={onClose}
      title={aggregate ? labelForEvent(aggregate.name) : ''}
      subtitle={aggregate?.name}
      maxWidth={560}
    >
      {aggregate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {aggregate.stopped && (
            <div style={{
              border: `1px solid ${t.danger}`, borderRadius: 14, padding: '10px 12px',
              color: t.danger, fontSize: 12.5, fontWeight: 600,
            }}>
              Stopped firing. {fmtInt(aggregate.priorCount)} occurrences in the previous period, none in this one.
            </div>
          )}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8,
          }}>
            <StatBox label="Total" value={fmtInt(total)} />
            <StatBox label="Members" value={fmtInt(users)} />
            <StatBox label="Per member" value={perUser.toFixed(1)} />
            <StatBox label="Prior total" value={fmtInt(aggregate.priorCount)} />
            <StatBox label="Prior members" value={fmtInt(aggregate.priorUsers)} />
            <StatBox
              label="Last seen"
              value={aggregate.lastSeenAt ? formatAgo(aggregate.lastSeenAt, { suffix: true }) : '-'}
            />
          </div>

          <ChartCard title="Daily count" subtitle={`Occurrences per day, last ${period}`}
            loading={dailyQ.isLoading}
            isEmpty={daily.length === 0 || daily.every(d => d.value === 0)}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={t.line} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: t.inkMuted }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={36} />
                <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill={t.brand} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div>
            <div style={{ color: t.ink, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Occurrences</div>
            <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 10 }}>
              Newest first, with the full properties payload
            </div>
            {occ.isError ? (
              <AdminErrorState title="Couldn't load occurrences" onRetry={() => occ.refetch()} />
            ) : occ.isLoading ? (
              <div style={{ height: 180, background: t.canvas, borderRadius: t.radius.md }} />
            ) : occRows.length === 0 ? (
              <EmptyState title="No recent occurrences" />
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {occRows.map((o, i) => {
                    const isLast = i === occRows.length - 1;
                    const p = o.user_id ? (profiles.data ?? {})[o.user_id] : null;
                    const name = o.user_id ? displayNameOf(p) : 'System';
                    const propsText = o.props && Object.keys(o.props).length > 0
                      ? JSON.stringify(o.props, null, 1)
                      : null;
                    const row = (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: t.ink, fontSize: 13, fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{name}</div>
                          {propsText && (
                            <pre style={{
                              color: t.inkFaint, fontSize: 10.5, margin: '4px 0 0',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                              maxHeight: 132, overflow: 'hidden',
                            }}>{propsText}</pre>
                          )}
                        </div>
                        <span style={{
                          color: t.inkFaint, fontSize: 12, fontVariantNumeric: 'tabular-nums',
                          textAlign: 'right', minWidth: 68, flexShrink: 0,
                        }}>{formatAgo(o.created_at, { suffix: true })}</span>
                      </>
                    );
                    const style: React.CSSProperties = {
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 0', textDecoration: 'none',
                      borderBottom: isLast ? 'none' : `1px solid ${t.line}`,
                    };
                    return o.user_id
                      ? <Link key={o.id} to={`/admin-v2/users?member=${o.user_id}`} style={style} onClick={onClose}>{row}</Link>
                      : <div key={o.id} style={style}>{row}</div>;
                  })}
                </div>
                {occ.hasNextPage && (
                  <button
                    onClick={() => occ.fetchNextPage()}
                    disabled={occ.isFetchingNextPage}
                    style={{
                      marginTop: 10, width: '100%', padding: '10px 0',
                      background: 'transparent', border: `1px solid ${t.line}`,
                      borderRadius: 999, color: t.ink, fontSize: 12.5, fontWeight: 700,
                      cursor: occ.isFetchingNextPage ? 'default' : 'pointer',
                    }}
                  >{occ.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>
                )}
              </>
            )}
          </div>

          <div style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          }} />
        </div>
      )}
    </AdminSheet>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: t.canvas, border: `1px solid ${t.line}`, borderRadius: 14,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        color: t.inkFaint, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        color: t.ink, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

// ─── Funnels ──────────────────────────────────────────────────────────────────

