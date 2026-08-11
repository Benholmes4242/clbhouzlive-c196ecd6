import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePanelRole } from '@/hooks/usePanelRole';
import { adminTheme as t } from '../theme';
import EmptyState from '../components/EmptyState';
import AdminAccessDenied from '../components/AdminAccessDenied';

type Row = {
  id: string;
  session_id: string | null;
  flushed_at: string;
  is_debug: boolean;
  row_kind: string;
  kind: string | null;
  page: string | null;
  count: number | null;
  p50: number | null;
  p95: number | null;
  worst: number | null;
  pass: number | null;
  slow: number | null;
  timeout: number | null;
  superseded: number | null;
  extra: any;
};

type RangeKey = '7d' | '30d' | '90d';
const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '30d': 30, '90d': 90 };

const HEAD_KINDS = ['feed.activate', 'swipe.vertical', 'swipe.pager', 'fs.open'];

function toISO(daysAgo: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

async function fetchRows(fromISO: string, includeDebug: boolean): Promise<Row[]> {
  // Fetch in pages of 1000
  const all: Row[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    let q = supabase
      .from('video_perf_rollups')
      .select('id,session_id,flushed_at,is_debug,row_kind,kind,page,count,p50,p95,worst,pass,slow,timeout,superseded,extra')
      .gte('flushed_at', fromISO)
      .order('flushed_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (!includeDebug) q = q.eq('is_debug', false);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < pageSize) break;
    from += pageSize;
    if (from > 20000) break; // safety
  }
  return all;
}

interface BucketAgg {
  count: number;
  p50w: number; // weighted sum
  p95w: number;
  worst: number;
  pass: number;
  slow: number;
  timeout: number;
  superseded: number;
}

function emptyAgg(): BucketAgg {
  return { count: 0, p50w: 0, p95w: 0, worst: 0, pass: 0, slow: 0, timeout: 0, superseded: 0 };
}

function foldBucket(a: BucketAgg, r: Row) {
  const c = r.count ?? 0;
  a.count += c;
  a.p50w += (r.p50 ?? 0) * c;
  a.p95w += (r.p95 ?? 0) * c;
  a.worst = Math.max(a.worst, r.worst ?? 0);
  a.pass += r.pass ?? 0;
  a.slow += r.slow ?? 0;
  a.timeout += r.timeout ?? 0;
  a.superseded += r.superseded ?? 0;
}

function passPct(a: BucketAgg) {
  const denom = a.count - a.superseded;
  if (denom <= 0) return null;
  return Math.round((a.pass / denom) * 100);
}

function num(n: number | null | undefined, unit = 'ms') {
  if (n == null || !isFinite(n)) return '—';
  if (unit === '%') return `${n}%`;
  return `${Math.round(n)}${unit ? ` ${unit}` : ''}`;
}

export default function VideoPerfPage() {
  const { role } = usePanelRole();
  const [range, setRange] = useState<RangeKey>('30d');
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [includeDebug, setIncludeDebug] = useState(false);
  const [sortKey, setSortKey] = useState<string>('count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const days = RANGE_DAYS[range];
  const fromISO = useMemo(() => toISO(days), [days]);
  const prevFromISO = useMemo(() => toISO(days * 2), [days]);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['video-perf-rollups', prevFromISO, includeDebug],
    queryFn: () => fetchRows(prevFromISO, includeDebug),
    staleTime: 60_000,
  });

  useEffect(() => {
    const h = () => {}; // refetch handled by react-query; noop
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, []);

  if (role === 'none' || role === 'unknown') return <AdminAccessDenied />;

  const cutISO = fromISO;
  const inCurrent = (r: Row) => r.flushed_at >= cutISO;
  const inPrev = (r: Row) => r.flushed_at < cutISO;

  const pagesSet = new Set<string>();
  for (const r of rows) if (r.page) pagesSet.add(r.page);
  const pageOptions = ['all', ...Array.from(pagesSet).sort()];

  const matchesPage = (r: Row) => pageFilter === 'all' || r.page === pageFilter;

  // ── HEADLINE: p95 of feed.activate on worst page (current vs prev)
  const p95ByPage = new Map<string, BucketAgg>();
  const p95ByPagePrev = new Map<string, BucketAgg>();
  let stallCurr = { stalls: 0, dur: 0 };
  let stallPrev = { stalls: 0, dur: 0 };
  let prefCurr = { hits: 0, issued: 0 };
  let prefPrev = { hits: 0, issued: 0 };
  const sessionsCurr = new Set<string>();
  let flushesCurr = 0;
  let flushesPrev = 0;

  for (const r of rows) {
    const curr = inCurrent(r);
    if (curr) flushesCurr++; else flushesPrev++;
    if (r.row_kind === 'bucket' && r.kind === 'feed.activate' && matchesPage(r)) {
      const map = curr ? p95ByPage : p95ByPagePrev;
      const key = r.page ?? '(none)';
      if (!map.has(key)) map.set(key, emptyAgg());
      foldBucket(map.get(key)!, r);
    }
    if (r.row_kind === 'session' && r.extra) {
      const bucket = curr ? stallCurr : stallPrev;
      bucket.stalls += r.extra.totalStalls ?? 0;
      bucket.dur += r.extra.totalDurationMs ?? 0;
    }
    if (r.row_kind === 'prefetch' && r.extra) {
      const bucket = curr ? prefCurr : prefPrev;
      bucket.hits += (r.extra.activationsWithPrefetch ?? 0) + (r.extra.activationsWithPrefetchWarm ?? 0);
      bucket.issued += r.extra.issued ?? 0;
    }
    if (curr && r.session_id) sessionsCurr.add(r.session_id);
  }

  // Worst page for p95 feed.activate
  let worstPage: string | null = null;
  let worstP95Curr = 0;
  for (const [pg, agg] of p95ByPage.entries()) {
    const p95 = agg.count > 0 ? agg.p95w / agg.count : 0;
    if (p95 > worstP95Curr) { worstP95Curr = p95; worstPage = pg; }
  }
  const worstPrevAgg = worstPage ? p95ByPagePrev.get(worstPage) : null;
  const worstP95Prev = worstPrevAgg && worstPrevAgg.count > 0 ? worstPrevAgg.p95w / worstPrevAgg.count : 0;

  const stallRateCurr = stallCurr.dur > 0 ? (stallCurr.stalls / (stallCurr.dur / 1000)) : null;
  const stallRatePrev = stallPrev.dur > 0 ? (stallPrev.stalls / (stallPrev.dur / 1000)) : null;
  const prefRateCurr = prefCurr.issued > 0 ? (prefCurr.hits / prefCurr.issued) * 100 : null;
  const prefRatePrev = prefPrev.issued > 0 ? (prefPrev.hits / prefPrev.issued) * 100 : null;

  // ── TREND: daily p50/p95 per kind for filtered page
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(dayKey(toISO(i)));
  const dailyByKind: Record<string, Record<string, BucketAgg>> = {};
  const dailyStalls: Record<string, { stalls: number; dur: number }> = {};
  const dailyPassMix: Record<string, { pass: number; slow: number; timeout: number }> = {};

  for (const r of rows) {
    if (!inCurrent(r)) continue;
    if (!matchesPage(r)) continue;
    const day = dayKey(r.flushed_at);
    if (r.row_kind === 'bucket' && r.kind && HEAD_KINDS.includes(r.kind)) {
      dailyByKind[r.kind] = dailyByKind[r.kind] || {};
      if (!dailyByKind[r.kind][day]) dailyByKind[r.kind][day] = emptyAgg();
      foldBucket(dailyByKind[r.kind][day], r);
      if (!dailyPassMix[day]) dailyPassMix[day] = { pass: 0, slow: 0, timeout: 0 };
      dailyPassMix[day].pass += r.pass ?? 0;
      dailyPassMix[day].slow += r.slow ?? 0;
      dailyPassMix[day].timeout += r.timeout ?? 0;
    }
    if (r.row_kind === 'session' && r.extra) {
      if (!dailyStalls[day]) dailyStalls[day] = { stalls: 0, dur: 0 };
      dailyStalls[day].stalls += r.extra.totalStalls ?? 0;
      dailyStalls[day].dur += r.extra.totalDurationMs ?? 0;
    }
  }

  const p50Series = dayKeys.map(d => {
    const row: any = { day: d.slice(5) };
    for (const k of HEAD_KINDS) {
      const agg = dailyByKind[k]?.[d];
      row[k] = agg && agg.count > 0 ? Math.round(agg.p50w / agg.count) : null;
    }
    return row;
  });
  const p95Series = dayKeys.map(d => {
    const row: any = { day: d.slice(5) };
    for (const k of HEAD_KINDS) {
      const agg = dailyByKind[k]?.[d];
      row[k] = agg && agg.count > 0 ? Math.round(agg.p95w / agg.count) : null;
    }
    return row;
  });
  const stallSeries = dayKeys.map(d => {
    const s = dailyStalls[d];
    return { day: d.slice(5), stallsPerSec: s && s.dur > 0 ? +(s.stalls / (s.dur / 1000)).toFixed(3) : 0 };
  });
  const passMixSeries = dayKeys.map(d => {
    const s = dailyPassMix[d] || { pass: 0, slow: 0, timeout: 0 };
    return { day: d.slice(5), PASS: s.pass, SLOW: s.slow, TO: s.timeout };
  });

  // Sparse-day warning
  const flushesByDay: Record<string, number> = {};
  for (const r of rows) {
    if (!inCurrent(r)) continue;
    if (!matchesPage(r)) continue;
    const d = dayKey(r.flushed_at);
    flushesByDay[d] = (flushesByDay[d] || 0) + 1;
  }
  const sparseDays = dayKeys.filter(d => (flushesByDay[d] || 0) < 20).length;

  // ── BREAKDOWN table
  type Bkey = string;
  const table = new Map<Bkey, { kind: string; page: string; agg: BucketAgg }>();
  for (const r of rows) {
    if (!inCurrent(r)) continue;
    if (r.row_kind !== 'bucket' || !r.kind) continue;
    if (!matchesPage(r)) continue;
    const k = `${r.kind}||${r.page ?? '(none)'}`;
    if (!table.has(k)) table.set(k, { kind: r.kind, page: r.page ?? '(none)', agg: emptyAgg() });
    foldBucket(table.get(k)!.agg, r);
  }
  const tableRows = Array.from(table.values()).map(row => {
    const c = row.agg.count;
    return {
      kind: row.kind,
      page: row.page,
      count: c,
      p50: c > 0 ? Math.round(row.agg.p50w / c) : 0,
      p95: c > 0 ? Math.round(row.agg.p95w / c) : 0,
      worst: row.agg.worst,
      passPct: passPct(row.agg),
      slow: row.agg.slow,
      timeout: row.agg.timeout,
      sup: row.agg.superseded,
    };
  });
  const sorted = [...tableRows].sort((a: any, b: any) => {
    const va = a[sortKey], vb = b[sortKey];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <SegControl
          value={range}
          onChange={(v) => setRange(v as RangeKey)}
          options={[{ value: '7d', label: '7d' }, { value: '30d', label: '30d' }, { value: '90d', label: '90d' }]}
        />
        <select
          value={pageFilter}
          onChange={e => setPageFilter(e.target.value)}
          style={selectStyle}
          aria-label="Page filter"
        >
          {pageOptions.map(p => <option key={p} value={p}>{p === 'all' ? 'All pages' : p}</option>)}
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.inkMuted, marginLeft: 'auto' }}>
          <input type="checkbox" checked={includeDebug} onChange={e => setIncludeDebug(e.target.checked)} />
          Include debug sessions
        </label>
      </div>

      {error && (
        <div style={{ ...cardStyle, color: t.dangerText, background: t.dangerSoft, borderColor: t.dangerSoft }}>
          Failed to load: {(error as Error).message}
        </div>
      )}

      {/* HEADLINE CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <HeadlineCard
          label={`feed.activate p95 ${worstPage ? `(${worstPage})` : ''}`}
          value={worstP95Curr ? `${Math.round(worstP95Curr)} ms` : '—'}
          prev={worstP95Prev}
          curr={worstP95Curr}
          higherIsWorse
          loading={isLoading}
        />
        <HeadlineCard
          label="Stall rate (per sec)"
          value={stallRateCurr != null ? stallRateCurr.toFixed(3) : '—'}
          prev={stallRatePrev ?? 0}
          curr={stallRateCurr ?? 0}
          higherIsWorse
          loading={isLoading}
        />
        <HeadlineCard
          label="Prefetch hit rate"
          value={prefRateCurr != null ? `${Math.round(prefRateCurr)}%` : '—'}
          prev={prefRatePrev ?? 0}
          curr={prefRateCurr ?? 0}
          higherIsWorse={false}
          loading={isLoading}
        />
        <HeadlineCard
          label="Sample size"
          value={`${sessionsCurr.size} sess · ${flushesCurr} flushes`}
          prev={flushesPrev}
          curr={flushesCurr}
          higherIsWorse={false}
          loading={isLoading}
        />
      </div>

      {sparseDays > 0 && (
        <div style={{ ...noteStyle }}>
          <Info size={13} />
          {sparseDays} of {days} days have &lt; 20 flushes — sample is thin; treat trends with care.
        </div>
      )}
      <div style={{ ...noteStyle }}>
        <Info size={13} />
        p50/p95 are count-weighted averages of per-flush percentiles (approximation — raw samples aren't shipped).
      </div>

      {/* TRENDS */}
      <ChartCard title="p50 (ms) by kind">
        <ChartLines data={p50Series} keys={HEAD_KINDS} />
      </ChartCard>
      <ChartCard title="p95 (ms) by kind">
        <ChartLines data={p95Series} keys={HEAD_KINDS} />
      </ChartCard>
      <ChartCard title="Stall rate (per second)">
        <ChartLines data={stallSeries} keys={['stallsPerSec']} colorOverride={[t.danger]} />
      </ChartCard>
      <ChartCard title="Outcome mix (PASS / SLOW / TO)">
        <ChartLines data={passMixSeries} keys={['PASS', 'SLOW', 'TO']} colorOverride={[t.ok, t.warn, t.danger]} />
      </ChartCard>

      {/* BREAKDOWN */}
      <div style={cardStyle}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.line}`, fontWeight: 700, color: t.ink, fontSize: 14 }}>
          Breakdown (kind × page)
        </div>
        {sorted.length === 0 ? (
          <EmptyState title="No data in range" subtitle="Try widening the range, changing the page filter, or including debug sessions." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {[
                    ['kind', 'Kind'], ['page', 'Page'], ['count', 'Count'],
                    ['p50', 'p50'], ['p95', 'p95'], ['worst', 'Worst'],
                    ['passPct', 'PASS%'], ['slow', 'SLOW'], ['timeout', 'TO'], ['sup', 'SUP'],
                  ].map(([k, label]) => (
                    <th key={k} onClick={() => toggleSort(k)} style={thStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {label}
                        {sortKey === k && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${t.line}` }}>
                    <td style={tdStyle}>{r.kind}</td>
                    <td style={tdStyle}>{r.page}</td>
                    <td style={tdStyle}>{r.count}</td>
                    <td style={tdStyle}>{r.p50}</td>
                    <td style={tdStyle}>{r.p95}</td>
                    <td style={tdStyle}>{r.worst}</td>
                    <td style={tdStyle}>{r.passPct != null ? `${r.passPct}%` : '—'}</td>
                    <td style={tdStyle}>{r.slow}</td>
                    <td style={tdStyle}>{r.timeout}</td>
                    <td style={tdStyle}>{r.sup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────── helpers / sub-components

const cardStyle: React.CSSProperties = {
  background: t.surface,
  border: `1px solid ${t.line}`,
  borderRadius: t.radius.lg,
  boxShadow: t.shadowCard,
};

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: '0 10px',
  borderRadius: t.radius.md,
  border: `1px solid ${t.line}`,
  background: t.surface,
  color: t.ink,
  fontSize: 13,
  fontWeight: 500,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  color: t.inkFaint,
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  color: t.ink,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
};

const noteStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: t.inkMuted,
  fontSize: 12,
  padding: '6px 10px',
  background: t.neutralSoft,
  borderRadius: t.radius.md,
  alignSelf: 'flex-start',
};

function SegControl({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${t.line}`, borderRadius: t.radius.md, overflow: 'hidden' }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '8px 14px',
              background: active ? t.ink : t.surface,
              color: active ? t.surface : t.ink,
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function HeadlineCard({
  label, value, prev, curr, higherIsWorse, loading,
}: {
  label: string; value: React.ReactNode; prev: number; curr: number;
  higherIsWorse: boolean; loading?: boolean;
}) {
  let deltaPct: number | null = null;
  if (prev > 0) deltaPct = Math.round(((curr - prev) / prev) * 100);
  const worseBy20 =
    deltaPct != null && ((higherIsWorse && deltaPct > 20) || (!higherIsWorse && deltaPct < -20));
  const showColor = deltaPct != null && Math.abs(deltaPct) >= 5;
  const bad = worseBy20;
  const good = deltaPct != null && ((higherIsWorse && deltaPct < -5) || (!higherIsWorse && deltaPct > 5));
  const chipBg = bad ? t.dangerSoft : good ? t.okSoft : t.neutralSoft;
  const chipFg = bad ? t.dangerText : good ? t.okText : t.inkMuted;
  return (
    <div style={{ ...cardStyle, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 96,
      borderColor: bad ? t.danger : t.line }}>
      <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: t.ink, fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>{loading ? '—' : value}</div>
      {deltaPct != null && (
        <span style={{
          alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: 2,
          padding: '2px 8px', borderRadius: 999,
          background: showColor ? chipBg : t.neutralSoft,
          color: showColor ? chipFg : t.inkMuted,
          fontSize: 12, fontWeight: 600,
        }}>
          {deltaPct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(deltaPct)}% vs prev
        </span>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.line}`, fontWeight: 700, color: t.ink, fontSize: 14 }}>
        {title}
      </div>
      <div style={{ height: 220, padding: 8 }}>{children}</div>
    </div>
  );
}

// Series colours from tokens. There is no blue token, so the third series
// takes inkMuted: one hue less than before, but no literal.
const LINE_COLORS = [t.ink, t.brand, t.inkMuted, t.ok, t.danger];
function ChartLines({ data, keys, colorOverride }: { data: any[]; keys: string[]; colorOverride?: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <CartesianGrid stroke={t.line} strokeDasharray="2 3" />
        <XAxis dataKey="day" stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={{ stroke: t.line }} />
        <YAxis stroke={t.inkFaint} fontSize={11} tickLine={false} axisLine={{ stroke: t.line }} width={40} />
        <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={(colorOverride ?? LINE_COLORS)[i % (colorOverride?.length ?? LINE_COLORS.length)]}
            strokeWidth={1.6}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
