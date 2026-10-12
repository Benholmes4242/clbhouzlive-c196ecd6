import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import { PANEL, LIST_PANEL, RAISED } from '../lib/panels';
import { formatDurationShort } from '../lib/chartPrimitives';
import type { InboxItem, InboxType } from '../hooks/useInboxFeed';
import { flowColumns, formatWaitHours, type InboxFlow } from '../hooks/useInboxFlow';
import {
  QUEUE_SHORT, ageLabel, isLongWait, oldestItem, totalMembers, type QueueSummary,
} from '../lib/inboxQueue';

/** BRIEF_INBOX_WORK_THE_QUEUE stage 2: the Inbox's tiles, chips, Flow and Tools. */

const DASH = '\u2014';
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' };
const MINI: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint };
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
    <div
      role="tablist"
      style={{ display: 'inline-flex', height: 32, border: `1px solid ${t.line}`, borderRadius: 999, padding: 2, boxSizing: 'border-box' }}
    >
      {(['open', 'done'] as const).map(k => {
        const active = view === k;
        return (
          <button
            key={k}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            style={{
              height: '100%', padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? t.ink : 'transparent', color: active ? t.canvas : t.inkMuted,
              fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {k === 'open' ? 'Open' : 'Done'}
            {k === 'open' && (
              <span style={{ ...NUM, background: t.brand, color: t.canvas, fontSize: 11, fontWeight: 800, padding: '0 6px', borderRadius: 999, lineHeight: '16px' }}>
                {openCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- 2.2 Figure tiles ----------

function Tile({ label, figure, caption, tone, loading }: {
  label: string; figure: string; caption: string; tone?: string; loading?: boolean;
}) {
  return (
    <div style={{ background: t.surface, borderRadius: 12, padding: '10px 10px 8px', minWidth: 0 }}>
      <div style={{ ...MINI, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ ...NUM, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: tone ?? t.ink, lineHeight: 1.2, marginTop: 2, ...(loading ? PULSE : {}) }}>
        {loading ? DASH : figure}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {loading ? '\u00a0' : caption}
      </div>
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
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 };
  const medianH = flow7?.median_wait_hours ?? null;
  const medianCaption = `median ${medianH == null ? DASH : formatDurationShort(medianH * 3600)}`;

  if (view === 'done') {
    const oldest = oldestItem(doneItems);
    return (
      <div style={grid}>
        <Tile label="Done" figure={String(doneItems.length)} caption="recently closed" loading={loading} />
        <Tile label="Oldest cleared" figure={oldest ? ageLabel(oldest.createdAt) : DASH} caption={oldest ? QUEUE_SHORT[oldest.type] : DASH} loading={loading} />
        <Tile label="Members" figure={String(totalMembers(doneItems))} caption="helped" loading={loading} />
        <Tile label="Median" figure={formatWaitHours(medianH)} caption="wait · 7d" loading={flow7Loading} />
      </div>
    );
  }

  const oldest = oldestItem(openItems);
  return (
    <div style={grid}>
      <Tile label="Open" figure={String(openItems.length)} caption={`${queueCount} queue${queueCount === 1 ? '' : 's'}`} loading={loading} />
      <Tile
        label="Longest"
        figure={oldest ? ageLabel(oldest.createdAt) : DASH}
        caption={oldest ? QUEUE_SHORT[oldest.type] : DASH}
        tone={oldest && isLongWait(oldest.createdAt) ? t.dangerText : undefined}
        loading={loading}
      />
      <Tile label="Members" figure={String(totalMembers(openItems))} caption="waiting on us" loading={loading} />
      <Tile label="Done 7d" figure={flow7 ? String(flow7.cleared) : DASH} caption={medianCaption} loading={flow7Loading} />
    </div>
  );
}

// ---------- 2.3 Queue chips ----------

const CHIP: React.CSSProperties = {
  height: 34, padding: '0 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
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
  return (
    <div
      className="inbox-chips"
      style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <button
        type="button"
        aria-pressed={allActive}
        onClick={() => onSelect('all')}
        style={{ ...CHIP, background: allActive ? t.ink : t.surface, color: allActive ? t.canvas : t.ink, ...(loading ? PULSE : {}) }}
      >
        All <span style={{ ...NUM, fontWeight: 800 }}>{loading ? DASH : total}</span>
      </button>
      {!loading && queues.map(q => {
        const active = selected === q.type;
        const long = isLongWait(q.oldestIso);
        return (
          <button
            key={q.type}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? 'all' : q.type)}
            style={{ ...CHIP, background: active ? t.ink : t.surface, color: active ? t.canvas : t.ink }}
          >
            {QUEUE_SHORT[q.type]}
            <span style={{ ...NUM, fontWeight: 800 }}>{q.count}</span>
            {long && (
              <span style={{ ...NUM, fontSize: 10.5, fontWeight: 700, color: t.dangerText }}>{ageLabel(q.oldestIso)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- 2.8 Row skeleton (settled shape) ----------

export function RowSkeleton({ first }: { first: boolean }) {
  const bar = (w: number | string, h: number): React.CSSProperties => ({ width: w, height: h, borderRadius: 4, background: RAISED, ...PULSE });
  return (
    <div style={{ padding: '12px 16px', borderTop: first ? 'none' : `1px solid ${t.hairline}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 }}>
        <div>
          <div style={{ ...bar('60%', 17) }} />
          <div style={{ ...bar('40%', 13), marginTop: 4 }} />
        </div>
        <div style={{ ...bar(30, 30) }} />
      </div>
      <div style={{ marginTop: 10, height: 36, borderRadius: 10, background: RAISED, ...PULSE }} />
    </div>
  );
}

// ---------- 2.5 Flow ----------

export function FlowPanel({ flow, loading, days = 14 }: { flow: InboxFlow | undefined; loading: boolean; days?: number }) {
  const cols = flowColumns(flow, days);
  const max = Math.max(1, ...cols.map(c => c.came_in));
  return (
    <section style={PANEL}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.ink }}>Flow</span>
        <span style={{ fontSize: 11, color: t.inkFaint }}>in vs cleared · {days}d</span>
      </div>
      <div
        aria-hidden
        style={{ display: 'grid', gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))`, gap: 3, height: 40, alignItems: 'end', ...(loading ? PULSE : {}) }}
      >
        {cols.map(c => {
          const backlog = c.came_in - c.cleared >= 3;
          return (
            <div
              key={c.date}
              title={`${c.date}: ${c.came_in} in, ${c.cleared} cleared`}
              style={{
                height: flow ? `${(c.came_in / max) * 100}%` : 0,
                minHeight: flow && c.came_in > 0 ? 2 : 0,
                borderRadius: '2px 2px 0 0',
                background: backlog ? t.dangerText : t.inkMuted,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
        {[
          { label: 'Came in', value: flow ? String(flow.came_in) : DASH, tone: t.ink },
          { label: 'Cleared', value: flow ? String(flow.cleared) : DASH, tone: t.okText },
          { label: 'Median wait', value: flow ? formatWaitHours(flow.median_wait_hours) : DASH, tone: t.ink },
        ].map(f => (
          <div key={f.label}>
            <div style={{ ...NUM, fontSize: 18, fontWeight: 800, color: f.tone, lineHeight: 1.2 }}>{f.value}</div>
            <div style={MINI}>{f.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- 2.6 Tools ----------

export function ToolRow({ to, title, sub }: { to: string; title: string; sub: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderTop: `1px solid ${t.hairline}`, textDecoration: 'none', color: t.ink,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{title}</div>
        <div style={{ fontSize: 11.5, color: t.inkMuted }}>{sub}</div>
      </div>
      <ChevronRight size={16} color={t.inkFaint} />
    </Link>
  );
}

export { LIST_PANEL };
