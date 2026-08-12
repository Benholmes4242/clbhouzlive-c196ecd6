import React, { useMemo, useState } from 'react';
import { adminTheme as t } from '../theme';
import ChartCard from './ChartCard';
import EmptyState from './EmptyState';
import AdminSheet from './AdminSheet';
import { labelForEvent } from '../lib/eventLabels';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  useScreenAnalytics,
  useScreenTopEvents,
  type ScreenRow,
} from '../hooks/useScreenAnalytics';

// ─── Formatting helpers ───────────────────────────────────────────────────────

/** "1m 42s" / "18s"; "-" when there are no dwell samples. */
export function formatDwell(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec)) return '-';
  const total = Math.round(sec);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/** "+20.1%" / "-14.3%"; "-" when prev_views was 0 (never invent a trend). */
export function formatTrend(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return '-';
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

const fmtInt = (n: number) => n.toLocaleString();
const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1',
};

type SortKey = 'views' | 'unique_users' | 'median_dwell_sec' | 'events_fired' | 'trend_pct';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'views',            label: 'Views' },
  { id: 'unique_users',     label: 'Unique users' },
  { id: 'median_dwell_sec', label: 'Dwell' },
  { id: 'events_fired',     label: 'Events' },
  { id: 'trend_pct',        label: 'Trend' },
];

// ─── Small primitives ─────────────────────────────────────────────────────────

function StatCard({
  eyebrow, value, tone,
}: { eyebrow: string; value: React.ReactNode; tone?: 'warn' }) {
  return (
    <div style={{
      background: tone === 'warn' ? t.warnSoft : t.surface,
      border: `1px solid ${tone === 'warn' ? t.warnSoft : t.line}`,
      borderRadius: t.radius.lg,
      boxShadow: t.shadowCard,
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 6,
      minWidth: 0,
    }}>
      <div style={{
        color: tone === 'warn' ? t.warnText : t.inkFaint,
        fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      }}>{eyebrow}</div>
      <div style={{
        color: tone === 'warn' ? t.warnText : t.ink,
        fontSize: 24, fontWeight: 700, lineHeight: 1, ...NUM,
      }}>{value}</div>
    </div>
  );
}

function Chip({
  active, children, onClick, tone,
}: { active?: boolean; children: React.ReactNode; onClick?: () => void; tone?: 'warn' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '5px 11px',
        borderRadius: 999,
        border: `1px solid ${active ? 'transparent' : t.line}`,
        background: active ? t.ink : tone === 'warn' ? t.warnSoft : t.surface,
        color: active ? t.surface : tone === 'warn' ? t.warnText : t.inkMuted,
        fontSize: 12,
        fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );
}

function TrendCell({ pct }: { pct: number | null }) {
  const text = formatTrend(pct);
  const color = pct === null ? t.inkFaint : pct > 0 ? t.okText : pct < 0 ? t.dangerText : t.inkMuted;
  return <span style={{ color, fontWeight: 700, ...NUM }}>{text}</span>;
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export default function ScreensTab({ days }: { days: number }) {
  const { data, isLoading, error } = useScreenAnalytics(days);
  const rows = useMemo(() => data ?? [], [data]);

  const [sortKey, setSortKey] = useState<SortKey>('views');
  const [desc, setDesc] = useState(true);
  const [area, setArea] = useState<string>('all');
  const [hideZero, setHideZero] = useState(false);
  const [selected, setSelected] = useState<ScreenRow | null>(null);

  React.useEffect(() => {
    analyticsEvents.track('admin_screens_viewed', { days });
  }, [days]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => { if (r.area) set.add(r.area); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const summary = useMemo(() => {
    const withTraffic = rows.filter(r => r.views > 0);
    const dwells = rows
      .map(r => r.median_dwell_sec)
      .filter((v): v is number => v !== null);
    dwells.sort((a, b) => a - b);
    const medianDwell = dwells.length
      ? dwells.length % 2
        ? dwells[(dwells.length - 1) / 2]
        : (dwells[dwells.length / 2 - 1] + dwells[dwells.length / 2]) / 2
      : null;
    return {
      live: withTraffic.length,
      dead: rows.length - withTraffic.length,
      totalViews: rows.reduce((s, r) => s + r.views, 0),
      medianDwell,
    };
  }, [rows]);

  const visible = useMemo(() => {
    let out = rows.slice();
    if (area !== 'all') out = out.filter(r => r.area === area);
    if (hideZero) out = out.filter(r => r.views > 0);
    const dir = desc ? -1 : 1;
    out.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = av === null ? -Infinity : av;
      const bn = bv === null ? -Infinity : bv;
      if (an === bn) return a.label.localeCompare(b.label);
      return an < bn ? dir * -1 : dir;
    });
    return out;
  }, [rows, area, hideZero, sortKey, desc]);

  const openRow = (r: ScreenRow) => {
    setSelected(r);
    analyticsEvents.track('admin_screen_detail_opened', { route_pattern: r.route_pattern });
  };

  if (error) {
    return <EmptyState title="Could not load screens" subtitle={(error as Error).message} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
      }}>
        <StatCard eyebrow="Screens with traffic" value={isLoading ? '-' : fmtInt(summary.live)} />
        <StatCard eyebrow="Dead screens" value={isLoading ? '-' : fmtInt(summary.dead)} tone="warn" />
        <StatCard eyebrow="Total views" value={isLoading ? '-' : fmtInt(summary.totalViews)} />
        <StatCard eyebrow="Median dwell" value={isLoading ? '-' : formatDwell(summary.medianDwell)} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            color: t.inkFaint, fontSize: 10.5, fontWeight: 700,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Sort</span>
          {SORTS.map(s => (
            <Chip key={s.id} active={s.id === sortKey} onClick={() => setSortKey(s.id)}>
              {s.label}
            </Chip>
          ))}
          <Chip onClick={() => setDesc(d => !d)}>{desc ? 'Most first' : 'Least first'}</Chip>
          <Chip active={hideZero} onClick={() => setHideZero(v => !v)}>
            {hideZero ? 'Zero-traffic hidden' : 'Hide zero-traffic'}
          </Chip>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <span style={{
            color: t.inkFaint, fontSize: 10.5, fontWeight: 700,
            letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0,
          }}>Area</span>
          <Chip active={area === 'all'} onClick={() => setArea('all')}>All</Chip>
          {areas.map(a => (
            <Chip key={a} active={area === a} onClick={() => setArea(a)}>{a}</Chip>
          ))}
        </div>
      </div>

      <ChartCard
        title="Screens"
        subtitle={`Last ${days} days - every active route, dead screens included`}
        loading={isLoading}
        isEmpty={!isLoading && rows.length === 0}
        emptyTitle="No screen data yet"
        height="auto"
      >
        {visible.length === 0 ? (
          <EmptyState title="No screens match these filters" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 620 }}>
              <thead>
                <tr>
                  {['Screen', 'Views', 'Users', 'Dwell', 'Events', 'Trend'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        textAlign: i === 0 ? 'left' : 'right',
                        color: t.inkFaint,
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        padding: '0 8px 8px',
                        whiteSpace: 'nowrap',
                      }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(r => {
                  const dead = r.views === 0;
                  return (
                    <tr
                      key={r.route_pattern}
                      onClick={() => openRow(r)}
                      style={{
                        borderTop: `1px solid ${t.line}`,
                        cursor: 'pointer',
                        opacity: dead ? 0.55 : 1,
                      }}
                    >
                      <td style={{ padding: '10px 8px', minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: t.ink, fontWeight: 700 }}>{r.label}</span>
                          {dead && (
                            <span style={{
                              background: t.neutralSoft, color: t.inkMuted,
                              borderRadius: 999, padding: '1px 7px',
                              fontSize: 10.5, fontWeight: 700,
                            }}>No traffic</span>
                          )}
                        </div>
                        <div style={{
                          color: t.inkMuted, fontSize: 12, marginTop: 2,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}>{r.route_pattern}</div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: t.ink, fontWeight: 700, ...NUM }}>
                        {fmtInt(r.views)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: t.inkMuted, ...NUM }}>
                        {fmtInt(r.unique_users)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: t.inkMuted, ...NUM }}>
                        {formatDwell(r.median_dwell_sec)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: t.inkMuted, ...NUM }}>
                        {fmtInt(r.events_fired)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <TrendCell pct={r.trend_pct} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      <ScreenDetailSheet
        row={selected}
        days={days}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function ScreenDetailSheet({
  row, days, onClose,
}: { row: ScreenRow | null; days: number; onClose: () => void }) {
  const { data: events, isLoading } = useScreenTopEvents(row?.route_pattern ?? null, days);

  return (
    <AdminSheet
      open={!!row}
      onClose={onClose}
      title={row?.label ?? ''}
      subtitle={row?.route_pattern}
    >
      {row && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
          }}>
            <StatCard eyebrow="Views" value={fmtInt(row.views)} />
            <StatCard eyebrow="Unique users" value={fmtInt(row.unique_users)} />
            <StatCard eyebrow="Sessions" value={fmtInt(row.unique_sessions)} />
            <StatCard eyebrow="Median dwell" value={formatDwell(row.median_dwell_sec)} />
            <StatCard eyebrow="Events fired" value={fmtInt(row.events_fired)} />
            <StatCard eyebrow="Trend" value={<TrendCell pct={row.trend_pct} />} />
          </div>

          <div>
            <div style={{
              color: t.inkFaint, fontSize: 10.5, fontWeight: 700,
              letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
            }}>Top events on this screen</div>
            {isLoading ? (
              <div style={{
                height: 120, background: t.canvas, borderRadius: t.radius.md,
                animation: 'admin-pulse 1.4s ease-in-out infinite',
              }} />
            ) : !events || events.length === 0 ? (
              <EmptyState title="No events on this screen" />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={e.name} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.line}` }}>
                      <td style={{ color: t.ink, padding: '8px 4px' }}>{labelForEvent(e.name)}</td>
                      <td style={{
                        color: t.inkMuted, padding: '8px 4px', textAlign: 'right', fontWeight: 700, ...NUM,
                      }}>{fmtInt(e.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </AdminSheet>
  );
}
