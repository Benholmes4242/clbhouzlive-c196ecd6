import React from 'react';
import { adminTheme as t } from '../theme';

type Tone = 'ok' | 'warn' | 'danger' | 'neutral';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  ok:      { bg: '#DCFCE7', fg: '#15803D' },
  warn:    { bg: '#FEF3C7', fg: '#B45309' },
  danger:  { bg: '#FEE2E2', fg: '#B91C1C' },
  neutral: { bg: '#F1F5F9', fg: t.inkMuted },
};

export default function StatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  const c = TONE[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '18px',
      }}
    >
      {children}
    </span>
  );
}
