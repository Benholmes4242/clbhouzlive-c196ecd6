import React from 'react';
import { adminTheme as t } from '../theme';

interface Props {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function EmptyState({ icon, title, subtitle, className }: Props) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
        color: t.inkMuted,
      }}
    >
      {icon && (
        <div style={{ color: t.inkFaint, marginBottom: 12, display: 'flex' }}>
          {icon}
        </div>
      )}
      <div style={{ color: t.ink, fontWeight: 600, fontSize: 15 }}>{title}</div>
      {subtitle && (
        <div style={{ color: t.inkMuted, fontSize: 13, marginTop: 4, maxWidth: 280 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
