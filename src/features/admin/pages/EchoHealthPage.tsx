import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { adminTheme as t } from '../theme';
import EmptyState from '../components/EmptyState';
import {
  useEchoEngineHealth,
  type EchoEngine,
  type EchoEngineLatest,
  type EchoEngineDay,
  type EchoEngineRecent,
} from '../hooks/useEchoEngineHealth';

const LABELS: Record<EchoEngine, string> = {
  claude:     'Claude',
  openai:     'GPT',
  gemini:     'Gemini',
  perplexity: 'Perplexity',
};
const ORDER: EchoEngine[] = ['claude', 'openai', 'gemini', 'perplexity'];

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

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function last14DayKeys(): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function EchoHealthPage() {
  const { data, isLoading, isError, refetch, runCheck } = useEchoEngineHealth();
  const [expanded, setExpanded] = useState<EchoEngine | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState<string | null>(null);

  // Wire admin-v2 header refresh button
  useEffect(() => {
    const handler = () => { refetch(); };
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [refetch]);

  const dayKeys = useMemo(last14DayKeys, []);

  const latestByEngine = useMemo(() => {
    const map = new Map<EchoEngine, EchoEngineLatest>();
    (data?.latest ?? []).forEach(r => map.set(r.engine, r));
    return map;
  }, [data]);

  const daysByEngine = useMemo(() => {
    const map = new Map<EchoEngine, Map<string, EchoEngineDay>>();
    (data?.days14 ?? data?.days7 ?? []).forEach(r => {
      if (!map.has(r.engine)) map.set(r.engine, new Map());
      map.get(r.engine)!.set(r.day, r);
    });
    return map;
  }, [data]);

  const onRun = async () => {
    setRunning(true);
    setRunErr(null);
    try {
      await runCheck();
    } catch (e: any) {
      setRunErr(e?.message || 'Check failed');
    } finally {
      setRunning(false);
    }
  };

  const hasAny = (data?.latest?.length ?? 0) > 0;
  const recent: EchoEngineRecent[] = data?.recent ?? [];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1024, margin: '0 auto' }}>
      {/* Engine status card */}
      <section
        style={{
          background: t.surface,
          border: `1px solid ${t.line}`,
          borderRadius: t.radius.lg,
          boxShadow: t.shadowCard,
          padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color={t.brand} />
            <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Echo Engine Health</div>
          </div>
          <button
            type="button"
            onClick={onRun}
            disabled={running}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: t.ink, color: t.surface,
              fontSize: 12, fontWeight: 600,
              borderRadius: 999, padding: '6px 12px',
              border: 'none', cursor: running ? 'default' : 'pointer',
              opacity: running ? 0.6 : 1,
            }}
          >
            <RefreshCw size={12} style={running ? { animation: 'admin-spin 1s linear infinite' } : undefined} />
            {running ? 'Running…' : 'Run check now'}
          </button>
        </div>

        {isLoading ? (
          <div style={{ height: 220, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle size={28} color={t.warn} />}
            title="Status unavailable"
            subtitle="Could not load engine health right now."
          />
        ) : !hasAny ? (
          <EmptyState
            icon={<Sparkles size={28} color={t.inkFaint} />}
            title="No checks yet"
            subtitle="Run a check to see engine status here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ORDER.map((eng, idx) => {
              const row = latestByEngine.get(eng);
              const days = daysByEngine.get(eng);
              const isOpen = expanded === eng && !!row && !row.ok;
              const dotColor = !row ? t.line : row.ok ? t.ok : t.danger;
              return (
                <div
                  key={eng}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    padding: '12px 4px',
                    borderTop: idx === 0 ? 'none' : `1px solid ${t.line}`,
                  }}
                >
                  <div
                    role={row && !row.ok ? 'button' : undefined}
                    onClick={() => { if (row && !row.ok) setExpanded(isOpen ? null : eng); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: row && !row.ok ? 'pointer' : 'default',
                    }}
                  >
                    <span
                      aria-label={row ? (row.ok ? 'ok' : 'fail') : 'never checked'}
                      style={{
                        width: 10, height: 10, borderRadius: 999,
                        background: dotColor, flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ color: t.ink, fontWeight: 600, fontSize: 14 }}>{LABELS[eng]}</span>
                        <span style={{ color: t.inkFaint, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row?.model_id ?? '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, color: t.inkMuted, fontSize: 11 }}>
                        <span>{row?.ms != null ? `${row.ms}ms` : '—'}</span>
                        <span>{row ? relTime(row.checked_at) : 'never checked'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {dayKeys.map(k => {
                        const d = days?.get(k);
                        const c = !d ? t.line : d.ok ? t.ok : t.danger;
                        return (
                          <span
                            key={k}
                            title={`${k}${d ? ` · ${d.ok ? 'ok' : 'fail'}${d.ms != null ? ` · ${d.ms}ms` : ''}` : ' · no check'}`}
                            style={{ width: 8, height: 8, borderRadius: 999, background: c, opacity: d ? 1 : 0.5 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {isOpen && row?.error ? (
                    <pre
                      style={{
                        marginTop: 8, padding: 10,
                        background: t.canvas, border: `1px solid ${t.line}`,
                        borderRadius: t.radius.md,
                        color: t.ink, fontSize: 11,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        maxHeight: 260, overflow: 'auto',
                      }}
                    >
                      {row.error}
                    </pre>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {runErr ? (
          <div style={{ color: t.danger, fontSize: 12 }}>{runErr}</div>
        ) : null}

        <style>{`
          @keyframes admin-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes admin-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        `}</style>
      </section>

      {/* Recent checks table */}
      <section
        style={{
          background: t.surface,
          border: `1px solid ${t.line}`,
          borderRadius: t.radius.lg,
          boxShadow: t.shadowCard,
          padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Recent checks</div>
          <span style={{ color: t.inkFaint, fontSize: 11 }}>Last {recent.length}</span>
        </div>

        {isLoading ? (
          <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={24} color={t.inkFaint} />}
            title="No recent checks"
            subtitle="Once a check runs, entries appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '18px 1fr 60px 60px 1fr 18px',
                gap: 10, alignItems: 'center',
                padding: '8px 4px',
                borderBottom: `1px solid ${t.line}`,
                color: t.inkFaint, fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}
            >
              <span />
              <span>Engine</span>
              <span style={{ textAlign: 'right' }}>ms</span>
              <span style={{ textAlign: 'right' }}>Status</span>
              <span>When</span>
              <span />
            </div>
            {recent.map((r, i) => {
              const open = expandedRow === i;
              const hasErr = !r.ok && !!r.error;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${t.line}` }}>
                  <div
                    role={hasErr ? 'button' : undefined}
                    onClick={() => { if (hasErr) setExpandedRow(open ? null : i); }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '18px 1fr 60px 60px 1fr 18px',
                      gap: 10, alignItems: 'center',
                      padding: '10px 4px',
                      cursor: hasErr ? 'pointer' : 'default',
                    }}
                  >
                    <span
                      aria-label={r.ok ? 'ok' : 'fail'}
                      style={{
                        width: 10, height: 10, borderRadius: 999,
                        background: r.ok ? t.ok : t.danger,
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>{LABELS[r.engine] ?? r.engine}</span>
                      <span style={{ color: t.inkFaint, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.model_id ?? '—'}
                      </span>
                    </div>
                    <span style={{ textAlign: 'right', color: t.inkMuted, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                      {r.ms != null ? r.ms : '—'}
                    </span>
                    <span
                      style={{
                        justifySelf: 'end',
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 999,
                        background: r.ok ? t.okSoft : t.dangerSoft,
                        color: r.ok ? t.okText : t.dangerText,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}
                    >
                      {r.ok ? 'ok' : 'fail'}
                    </span>
                    <span style={{ color: t.inkMuted, fontSize: 12 }}>{fmtWhen(r.checked_at)}</span>
                    <span style={{ color: t.inkFaint, display: 'flex', justifyContent: 'flex-end' }}>
                      {hasErr ? (open ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}
                    </span>
                  </div>
                  {open && hasErr ? (
                    <pre
                      style={{
                        margin: '0 0 10px 0', padding: 10,
                        background: t.canvas, border: `1px solid ${t.line}`,
                        borderRadius: t.radius.md,
                        color: t.ink, fontSize: 11,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        maxHeight: 320, overflow: 'auto',
                      }}
                    >
                      {r.error}
                    </pre>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
