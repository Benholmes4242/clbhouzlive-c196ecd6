import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp, Play, ShieldCheck } from 'lucide-react';
import { adminTheme as t } from '../theme';
import AdminErrorState from '../components/AdminErrorState';
import { useStabilityData, type TopError, type ErrorRow } from '../hooks/useStability';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { trackError } from '@/lib/errorTracking';

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

function firstStackLine(stack: string | undefined | null): string {
  if (!stack) return '';
  return String(stack).split('\n')[0]?.trim() ?? '';
}

export default function StabilityTab() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const q = useStabilityData();

  if (q.isError) {
    return <AdminErrorState message="Could not load stability data." onRetry={() => q.refetch()} />;
  }

  const d = q.data;
  const loading = q.isLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Headline loading={loading} data={d} />
      <ErrorsChart loading={loading} buckets={d?.buckets ?? []} />
      <TopErrorsCard loading={loading} topErrors={d?.topErrors ?? []} />
      {can.manageAdmins && (
        <PipeTest onSent={() => q.refetch()} />
      )}
    </div>
  );
}

function Headline({ loading, data }: { loading: boolean; data: ReturnType<typeof useStabilityData>['data'] }) {
  const noneEver = !!data?.noErrorsEver;
  const pct = data?.crashFreePct;

  const primary = loading
    ? '—'
    : noneEver
      ? '100%'
      : pct == null
        ? '—'
        : `${pct.toFixed(pct >= 99.95 ? 2 : 1)}%`;

  const detail = loading
    ? 'Loading'
    : noneEver
      ? 'No errors recorded'
      : `${data?.sessions7d ?? 0} sessions · ${data?.totalErrors7d ?? 0} errors (7d)`;

  return (
    <section style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: 18, boxShadow: t.shadowCard,
      padding: 16, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span aria-hidden style={{
        width: 40, height: 40, borderRadius: '34%',
        background: noneEver || (pct != null && pct >= 99) ? t.okSoft : t.warnSoft,
        color: noneEver || (pct != null && pct >= 99) ? t.okText : t.warnText,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <ShieldCheck size={20} />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          color: t.inkFaint, fontSize: 10.5, fontWeight: 700,
          letterSpacing: 0.4, textTransform: 'uppercase',
        }}>
          Crash-free sessions · 7d
        </div>
        <div style={{
          color: t.ink, fontSize: 24, fontWeight: 700, lineHeight: 1.1,
          fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
        }}>
          {primary}
        </div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>{detail}</div>
      </div>
    </section>
  );
}

function ErrorsChart({ loading, buckets }: { loading: boolean; buckets: { date: string; value: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  return (
    <section style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: 18, boxShadow: t.shadowCard,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        color: t.inkFaint, fontSize: 10.5, fontWeight: 700,
        letterSpacing: 0.4, textTransform: 'uppercase',
      }}>
        Errors · last 14 days
      </div>
      {loading ? (
        <div style={{ height: 88, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 88 }}>
          {buckets.map((b) => {
            const h = Math.round((b.value / max) * 80);
            return (
              <div key={b.date} title={`${b.date}: ${b.value}`}
                style={{
                  flex: 1, height: Math.max(2, h),
                  background: b.value === 0 ? t.line : t.danger,
                  borderRadius: 3, opacity: b.value === 0 ? 0.6 : 1,
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function TopErrorsCard({ loading, topErrors }: { loading: boolean; topErrors: TopError[] }) {
  return (
    <section style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: 18, boxShadow: t.shadowCard,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 16px',
        color: t.ink, fontSize: 14.5, fontWeight: 700,
        borderBottom: `1px solid ${t.line}`,
      }}>
        Top errors
      </div>
      {loading ? (
        <div style={{ padding: 16 }}>
          <div style={{ height: 72, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
        </div>
      ) : topErrors.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: t.inkMuted, fontSize: 13 }}>
          No errors recorded. New app errors will appear here within a minute.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {topErrors.map((e, i) => (
            <ErrorGroupRow key={`${e.message}-${i}`} err={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ErrorGroupRow({ err }: { err: TopError }) {
  const [open, setOpen] = useState(false);
  const isTest = err.kind === 'test';
  return (
    <li style={{ borderTop: `1px solid ${t.line}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'transparent', border: 'none', textAlign: 'left',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}
      >
        <span aria-hidden style={{
          width: 28, height: 28, borderRadius: '34%',
          background: isTest ? t.brandSoft : t.dangerSoft,
          color: isTest ? t.warnText : t.dangerText,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AlertTriangle size={14} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: t.ink, fontSize: 13, fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isTest ? 'Test · ' : ''}{err.message}
          </div>
          <div style={{ color: t.inkMuted, fontSize: 11, marginTop: 2 }}>
            {err.count} occurrence{err.count === 1 ? '' : 's'} · {err.users} user{err.users === 1 ? '' : 's'} · {relTime(err.last)}
          </div>
        </div>
        {open ? <ChevronUp size={14} color={t.inkFaint} /> : <ChevronDown size={14} color={t.inkFaint} />}
      </button>
      {open && <OccurrenceList rows={err.rows} />}
    </li>
  );
}

function OccurrenceList({ rows }: { rows: ErrorRow[] }) {
  const items = useMemo(() => rows.slice(0, 20), [rows]);
  return (
    <ul style={{ listStyle: 'none', padding: '0 16px 12px', margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((r) => {
        const route = r.props?.route ?? '';
        const stackHead = firstStackLine(r.props?.stack);
        return (
          <li key={r.id} style={{
            background: t.canvas, border: `1px solid ${t.line}`,
            borderRadius: t.radius.md, padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: t.ink, fontSize: 12, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {r.user_id ? (
                  <Link to={`/admin-v2/members?member=${r.user_id}`} style={{ color: t.brandText, textDecoration: 'none' }}>
                    Member
                  </Link>
                ) : (
                  <span style={{ color: t.inkMuted }}>Signed out</span>
                )}
                {route ? <span style={{ color: t.inkMuted, fontWeight: 500 }}> · {route}</span> : null}
              </div>
              {stackHead && (
                <div style={{
                  color: t.inkFaint, fontSize: 11, marginTop: 2,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{stackHead}</div>
              )}
            </div>
            <span style={{ color: t.inkFaint, fontSize: 11, flexShrink: 0 }}>{relTime(r.created_at)}</span>
          </li>
        );
      })}
      {rows.length > items.length && (
        <li style={{ color: t.inkFaint, fontSize: 11, padding: '4px 4px 0' }}>
          Showing 20 of {rows.length}.
        </li>
      )}
    </ul>
  );
}

function PipeTest({ onSent }: { onSent: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', background: t.surface,
      border: `1px dashed ${t.line}`, borderRadius: t.radius.md,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: t.ink, fontSize: 13, fontWeight: 700 }}>Diagnostics</div>
        <div style={{ color: t.inkMuted, fontSize: 11 }}>
          Exercises the full tracking pipeline without crashing anything.
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          trackError({ kind: 'test', message: 'Admin pipe test' });
          setSent(true);
          setTimeout(onSent, 2000);
        }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 999,
          background: sent ? t.okSoft : t.brandSoft,
          color: sent ? t.okText : t.warnText,
          border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <Play size={12} />
        {sent ? 'Sent' : 'Send test error'}
      </button>
    </div>
  );
}
