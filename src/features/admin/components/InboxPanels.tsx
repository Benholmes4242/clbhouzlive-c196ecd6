import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LIST_PANEL } from '../lib/panels';
import { formatDurationShort } from '../lib/chartPrimitives';
import type { InboxItem, InboxType } from '../hooks/useInboxFeed';
import { flowColumns, formatWaitHours, type InboxFlow } from '../hooks/useInboxFlow';
import {
  QUEUE_SHORT, ageLabel, isLongWait, longestWaitHours, oldestItem, totalMembers, type QueueSummary,
} from '../lib/inboxQueue';

/** BRIEF_INBOX_WORK_THE_QUEUE stage 2: the Inbox's tiles, chips, Flow and Tools. */

const DASH = '\u2014';
/** ADMIN_INBOX_V3: the Command centre's v3 tokens (src/index.css --cc3-*); no amber. */
export const CC3 = {
  canvas: 'var(--cc3-canvas)', surface: 'var(--cc3-surface)', inset: 'var(--cc3-inset)',
  ink: 'var(--cc3-ink)', mute: 'var(--cc3-mute)', faint: 'var(--cc3-faint)',
  good: 'var(--cc3-good)', bad: 'var(--cc3-bad)', hair: 'var(--cc3-hair)', line: 'var(--cc3-line)',
  track: 'var(--cc3-track)',
} as const;
export const FLOW_IN = 'rgba(233,237,243,.32)';
export const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"tnum" 1, "lnum" 1' };
const MINI: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: CC3.faint };
export const PANEL3: React.CSSProperties = { background: CC3.surface, borderRadius: 16, padding: 14 };
export const LIST3: React.CSSProperties = { background: CC3.surface, borderRadius: 16, padding: '14px 0 4px' };
export const PANEL_TITLE: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CC3.ink };
export const PANEL_META: React.CSSProperties = { fontSize: 11, color: CC3.faint };
const PULSE: React.CSSProperties = { animation: 'admin-pulse 1.4s ease-in-out infinite' };

/** Live golf_courses count for the search placeholder - never a hard-coded figure. */
export function useCatalogueTotal(enabled: boolean): number | null {
  const q = useQuery({
    queryKey: ['admin', 'golf-courses-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('golf_courses').select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? null;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
  return q.data ?? null;
}

// ---------- 2.1 Open / Done ----------

export function OpenDoneControl({ view, openCount, onChange }: {
  view: 'open' | 'done'; openCount: number; onChange: (v: 'open' | 'done') => void;
}) {
  return (
    <div role="tablist" style={{ display: 'inline-flex', background: CC3.surface, borderRadius: 999, padding: 3, border: 'none' }}>
      {(['open', 'done'] as const).map(k => {
        const active = view === k;
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            style={{
              height: 24, padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? CC3.ink : 'transparent', color: active ? CC3.canvas : CC3.faint,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {k === 'open' ? 'Open' : 'Done'}
            {k === 'open' && (
              <span data-open-count data-tone={active ? 'canvas' : 'ink'} style={{ ...NUM, fontWeight: 700, color: active ? CC3.canvas : CC3.ink }}>{openCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- 2.2 Figures ----------

function Stat({ label, figure, caption, tone, loading }: {
  label: string; figure: string; caption?: string; tone?: string; loading?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }} data-stat={label}>
      <div style={MINI}>{label}</div>
      <div data-figure data-tone={tone === CC3.bad ? 'bad' : 'ink'} style={{ ...NUM, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: tone ?? CC3.ink, marginTop: 3, ...(loading ? PULSE : {}) }}>
        {loading ? DASH : figure}
      </div>
      {caption !== undefined && (
        <div style={{ fontSize: 10.5, fontWeight: 600, color: CC3.faint, marginTop: 1, overflowWrap: 'anywhere' }}>
          {loading ? '\u00a0' : caption}
        </div>
      )}
    </div>
  );
}

export function FigureTiles({ view, loading, openItems, doneItems, queueCount, flow7, flow7Loading }: {
  view: 'open' | 'done';
  loading: boolean;
  openItems: InboxItem[];
  doneItems: InboxItem[];
  queueCount: number;
  flow7: InboxFlow | undefined;
  flow7Loading: boolean;
}) {
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 };
  const medianH = flow7?.median_wait_hours ?? null;
  const medianCaption = `median ${medianH == null ? DASH : formatDurationShort(medianH * 3600)}`;

  if (view === 'done') {
    const wait = longestWaitHours(doneItems);
    return (
      <section style={PANEL3} data-figures="done">
        <div style={grid}>
          <Stat label="Done" figure={String(doneItems.length)} caption="recently closed" loading={loading} />
          <Stat label="Longest" figure={formatWaitHours(wait)} caption="to clear" loading={loading} />
          <Stat label="Members" figure={String(totalMembers(doneItems))} caption="helped" loading={loading} />
          <Stat label="Median" figure={formatWaitHours(medianH)} caption={'wait \u00b7 7d'} loading={flow7Loading} />
        </div>
      </section>
    );
  }

  const oldest = oldestItem(openItems);
  return (
    <section style={PANEL3} data-figures="open">
      <div style={grid}>
        <Stat label="Open" figure={String(openItems.length)} caption={`${queueCount} queue${queueCount === 1 ? '' : 's'}`} loading={loading} />
        <Stat
          label="Longest"
          figure={oldest ? ageLabel(oldest.createdAt) : DASH}
          caption={oldest ? QUEUE_SHORT[oldest.type] : DASH}
          tone={oldest && isLongWait(oldest.createdAt) ? CC3.bad : undefined}
          loading={loading}
        />
        <Stat label="Members" figure={String(totalMembers(openItems))} caption="waiting on us" loading={loading} />
        <Stat label="Done 7d" figure={flow7 ? String(flow7.cleared) : DASH} caption={medianCaption} loading={flow7Loading} />
      </div>
    </section>
  );
}

// ---------- 2.3 Queue chips ----------

const CHIP: React.CSSProperties = {
  height: 28, padding: '0 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, border: 'none', cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function QueueChips({ loading, total, queues, selected, onSelect }: {
  loading: boolean;
  total: number;
  queues: QueueSummary[];
  selected: InboxType | 'all';
  onSelect: (id: string) => void;
}) {
  const allActive = selected === 'all';
  const chip = (active: boolean): React.CSSProperties => ({ ...CHIP, background: active ? CC3.ink : CC3.surface, color: active ? CC3.canvas : CC3.mute });
  const count = (active: boolean): React.CSSProperties => ({ ...NUM, fontWeight: 700, color: active ? CC3.canvas : CC3.ink });
  return (
    <div className="inbox-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <button type="button" aria-pressed={allActive} onClick={() => onSelect('all')} style={{ ...chip(allActive), ...(loading ? PULSE : {}) }}>
        All <span style={count(allActive)}>{loading ? DASH : total}</span>
      </button>
      {!loading && queues.map(q => {
        const active = selected === q.type;
        const long = isLongWait(q.oldestIso);
        return (
          <button key={q.type} type="button" aria-pressed={active} onClick={() => onSelect(active ? 'all' : q.type)} style={chip(active)}>
            {QUEUE_SHORT[q.type]}
            <span style={count(active)}>{q.count}</span>
            {long && <span data-chip-age data-tone="bad" style={{ ...NUM, fontSize: 10.5, fontWeight: 700, color: CC3.bad }}>{ageLabel(q.oldestIso)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ---------- 2.8 Row skeleton (settled shape) ----------

export function RowSkeleton({ first }: { first: boolean }) {
  const bar = (w: number | string, h: number): React.CSSProperties => ({ width: w, height: h, borderRadius: 4, background: CC3.inset, ...PULSE });
  return (
    <div style={{ padding: '11px 14px 12px', borderTop: first ? 'none' : `1px solid ${CC3.hair}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12 }}>
        <div>
          <div style={bar('60%', 15)} />
          <div style={{ ...bar('40%', 11), marginTop: 4 }} />
        </div>
        <div style={bar(28, 28)} />
      </div>
      <div style={{ marginTop: 9, height: 30, borderRadius: 9, background: CC3.inset, ...PULSE }} />
    </div>
  );
}

// ---------- 2.5 Flow ----------

const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
};

const barPx = (v: number, max: number, area: number) => (v > 0 ? Math.max(2, (v / max) * area) : 0);

export function FlowPanel({ flow, loading, days = 14 }: { flow: InboxFlow | undefined; loading: boolean; days?: number }) {
  const cols = flowColumns(flow, days);
  const max = Math.max(1, ...cols.map(c => c.came_in), ...cols.map(c => c.cleared));
  const row = (h: number, align: 'end' | 'start'): React.CSSProperties => ({
    display: 'grid', gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))`, gap: 3, height: h, alignItems: align, ...(loading ? PULSE : {}),
  });
  const swatch = (bg: string): React.CSSProperties => ({ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: bg, marginRight: 4, verticalAlign: -1 });
  return (
    <section style={PANEL3} data-flow>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <span style={PANEL_TITLE}>Flow</span>
        <span data-flow-key style={{ ...PANEL_META, display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <span><span data-swatch="in" style={swatch(FLOW_IN)} />in</span>
          <span><span data-swatch="cleared" style={swatch(CC3.good)} />cleared</span>
          <span>{`\u00b7 ${days}D`}</span>
        </span>
      </div>
      <div aria-hidden data-flow-in style={row(30, 'end')}>
        {cols.map(c => (
          <div key={c.date} title={`${c.date}: ${c.came_in} in`} style={{ height: flow ? barPx(c.came_in, max, 30) : 0, borderRadius: '2px 2px 0 0', background: FLOW_IN }} />
        ))}
      </div>
      <div data-flow-axis style={{ height: 1, background: CC3.line, marginTop: 2 }} />
      <div aria-hidden data-flow-cleared style={{ ...row(18, 'start'), marginTop: 2 }}>
        {cols.map(c => (
          <div key={c.date} title={`${c.date}: ${c.cleared} cleared`} style={{ height: flow ? barPx(c.cleared, max, 18) : 0, borderRadius: '0 0 2px 2px', background: CC3.good }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: CC3.faint, marginTop: 5 }}>
        <span>{cols[0] ? shortDate(cols[0].date) : ''}</span>
        <span>today</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${CC3.hair}` }}>
        <Stat label="Came in" figure={flow ? String(flow.came_in) : DASH} />
        <Stat label="Cleared" figure={flow ? String(flow.cleared) : DASH} />
        <Stat label="Median wait" figure={flow ? formatWaitHours(flow.median_wait_hours) : DASH} />
      </div>
    </section>
  );
}

// ---------- 2.6 Tools ----------

export function ToolRow({ to, title, sub }: { to: string; title: string; sub: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 14px',
        borderTop: `1px solid ${CC3.hair}`, textDecoration: 'none', color: CC3.ink,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: CC3.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: CC3.faint, marginTop: 2 }}>{sub}</div>
      </div>
      <span aria-hidden style={{ fontSize: 13, fontWeight: 600, color: CC3.faint, lineHeight: 1 }}>{'\u203a'}</span>
    </Link>
  );
}

export { LIST_PANEL };
