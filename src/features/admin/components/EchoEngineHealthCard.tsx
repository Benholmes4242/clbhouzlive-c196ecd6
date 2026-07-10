import React, { useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { adminTheme as t } from '../theme';
import EmptyState from './EmptyState';
import {
  useEchoEngineHealth,
  type EchoEngine,
  type EchoEngineLatest,
  type EchoEngineDay,
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

function last7DayKeys(): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function EchoEngineHealthCard() {
  const { data, isLoading, isError, runCheck } = useEchoEngineHealth();
  const [expanded, setExpanded] = useState<EchoEngine | null>(null);
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState<string | null>(null);

  const dayKeys = useMemo(last7DayKeys, []);

  const latestByEngine = useMemo(() => {
    const map = new Map<EchoEngine, EchoEngineLatest>();
    (data?.latest ?? []).forEach(r => map.set(r.engine, r));
    return map;
  }, [data]);

  const daysByEngine = useMemo(() => {
    const map = new Map<EchoEngine, Map<string, EchoEngineDay>>();
    (data?.days7 ?? []).forEach(r => {
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

  return (
    <div
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
        <div style={{ height: 200, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle size={28} color={t.warn} />}
          title="Status unavailable"
          subtitle="Could not load engine health right now."
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
                  padding: '10px 4px',
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
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
                  <div style={{ display: 'flex', gap: 3 }}>
                    {dayKeys.map(k => {
                      const d = days?.get(k);
                      const c = !d ? t.line : d.ok ? t.ok : t.danger;
                      return (
                        <span
                          key={k}
                          title={`${k}${d ? ` · ${d.ok ? 'ok' : 'fail'}${d.ms != null ? ` · ${d.ms}ms` : ''}` : ' · no check'}`}
                          style={{ width: 6, height: 6, borderRadius: 999, background: c, opacity: d ? 1 : 0.5 }}
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
                      maxHeight: 220, overflow: 'auto',
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
      `}</style>
    </div>
  );
}
