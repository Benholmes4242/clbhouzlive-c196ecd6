/**
 * Shared SectionShell — dispatch section header + optional right link.
 * Spec: eyebrow 10.5/800/0.14em amber, right link 11/700 muted.
 */

import type { ReactNode } from 'react';
import { V4 } from '../tokens';
import { SPACE } from '@/lib/spacing';

export function SectionShell({
  eyebrow,
  linkLabel,
  onLinkClick,
  children,
  eyebrowColor,
  rightMeta,
}: {
  eyebrow: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  children: ReactNode;
  eyebrowColor?: string;
  rightMeta?: ReactNode;
}) {
  return (
    <section style={{ padding: '24px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: eyebrowColor ?? V4.amber, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {eyebrow}
        </span>
        {rightMeta ? (
          <span style={{ color: V4.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontVariantNumeric: 'tabular-nums' }}>
            {rightMeta}
          </span>
        ) : linkLabel ? (
          <button
            onClick={onLinkClick}
            style={{ background: 'transparent', border: 'none', color: V4.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer', padding: 0 }}
          >
            {linkLabel} ›
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function V4Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: V4.surface,
        border: `0.5px solid ${V4.cardBorder}`,
        borderRadius: V4.cardRadius,
        boxShadow: V4.cardShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
