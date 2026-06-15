import React from 'react';
import { adminTheme as t } from '../theme';
import EmptyState from './EmptyState';

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
}: Props) {
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

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  );
}
