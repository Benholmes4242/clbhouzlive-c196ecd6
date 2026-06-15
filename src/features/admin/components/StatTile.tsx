import React from 'react';
import { adminTheme as t } from '../theme';

export default function StatTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: t.radius.md,
        background: t.canvas,
        border: `1px solid ${t.line}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ color: t.inkFaint, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ color: t.ink, fontSize: 18, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
