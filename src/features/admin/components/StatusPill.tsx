import React from 'react';
import { adminTheme as t } from '../theme';

type Tone = 'ok' | 'warn' | 'danger' | 'neutral';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  ok:      { bg: t.okSoft,     fg: t.okText },
  warn:    { bg: t.warnSoft,   fg: t.warnText },
  danger:  { bg: t.dangerSoft, fg: t.dangerText },
  neutral: { bg: t.neutralSoft, fg: t.inkMuted },
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
