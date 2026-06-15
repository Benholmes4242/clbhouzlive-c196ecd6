import React from 'react';
import { adminTheme as t } from '../theme';
import EmptyState from './EmptyState';

export interface DataListColumn<R> {
  key: string;
  header: string;
  render: (row: R) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
}

interface Props<R> {
  columns: DataListColumn<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  renderCard?: (row: R) => React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function DataList<R>({
  columns,
  rows,
  rowKey,
  renderCard,
  loading,
  emptyTitle = 'Nothing here yet',
  emptySubtitle,
}: Props<R>) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 56,
              background: t.canvas,
              borderRadius: t.radius.md,
              animation: 'admin-pulse 1.4s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <>
      {/* Desktop / tablet — table */}
      <div className="admin-datalist-table">
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    textAlign: c.align ?? 'left',
                    color: t.inkFaint,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    padding: '8px 12px',
                    borderBottom: `1px solid ${t.line}`,
                    width: c.width,
                  }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      textAlign: c.align ?? 'left',
                      color: t.ink,
                      padding: '12px',
                      borderBottom: `1px solid ${t.line}`,
                      verticalAlign: 'middle',
                    }}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — stacked cards */}
      <div className="admin-datalist-cards" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            style={{
              background: t.surface,
              border: `1px solid ${t.line}`,
              borderRadius: t.radius.md,
              padding: 12,
            }}
          >
            {renderCard ? (
              renderCard(row)
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {columns.map((c) => (
                  <div
                    key={c.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: t.inkFaint, fontSize: 12 }}>{c.header}</span>
                    <span style={{ color: t.ink, textAlign: 'right' }}>{c.render(row)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .admin-datalist-table { display: none; }
        .admin-datalist-cards { display: flex; }
        @media (min-width: 768px) {
          .admin-datalist-table { display: block; }
          .admin-datalist-cards { display: none; }
        }
      `}</style>
    </>
  );
}
