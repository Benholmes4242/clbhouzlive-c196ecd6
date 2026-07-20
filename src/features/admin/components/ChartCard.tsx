import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { adminTheme as t } from '../theme';
import EmptyState from './EmptyState';

export interface DataTableRow {
  label: string;
  value: number | string | null;
}

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  children: React.ReactNode;
  height?: number | string;
  /**
   * C4-5: collapsed "View data" expander. Renders a two-column table
   * (label, value). Numbers use tabular-nums. No new queries — callers pass
   * the same series they already handed the chart.
   */
  dataTable?: DataTableRow[];
}

export default function ChartCard({
  title,
  subtitle,
  action,
  loading,
  isEmpty,
  emptyTitle = 'No data yet',
  emptySubtitle,
  children,
  height = 220,
  dataTable,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasTable = !!(dataTable && dataTable.length > 0) && !loading && !isEmpty;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{title}</div>
          {subtitle && (
            <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {action}
      </div>

      <div style={{ height, width: '100%' }}>
        {loading ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: t.canvas,
              borderRadius: t.radius.md,
              animation: 'admin-pulse 1.4s ease-in-out infinite',
            }}
          />
        ) : isEmpty ? (
          <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
        ) : (
          children
        )}
      </div>

      {hasTable && (
        <div style={{ borderTop: `1px solid ${t.line}`, marginTop: 4, paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', padding: 0,
              color: t.inkMuted, fontSize: 11, fontWeight: 700,
              letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <ChevronDown
              size={12}
              style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 120ms' }}
            />
            {open ? 'Hide data' : 'View data'}
            <span style={{ color: t.inkFaint, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
              ({dataTable!.length})
            </span>
          </button>
          {open && (
            <div style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {dataTable!.map((r, i) => (
                    <tr key={`${r.label}-${i}`} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.line}` }}>
                      <td style={{ color: t.inkMuted, padding: '6px 4px' }}>{r.label}</td>
                      <td
                        style={{
                          color: t.ink, padding: '6px 4px', textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          fontFeatureSettings: '"tnum" 1',
                          fontWeight: 600,
                        }}
                      >
                        {r.value ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  );
}
