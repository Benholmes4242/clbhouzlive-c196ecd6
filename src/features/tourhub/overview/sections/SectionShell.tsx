/**
 * Shared SectionShell — dispatch section header + optional right link.
 * Spec: eyebrow 10.5/800/0.14em amber, right link 11/700 muted.
 */

import type { ReactNode } from 'react';
import { V4 } from '../tokens';
import { SPACE } from '@/lib/spacing';

export function SectionShell({
  eyebrow,
  subline,
  linkLabel,
  onLinkClick,
  children,
  eyebrowColor,
  rightMeta,
}: {
  eyebrow: string;
  subline?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  children: ReactNode;
  eyebrowColor?: string;
  rightMeta?: ReactNode;
}) {
  return (
    <section style={{ padding: '0 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: `0 ${SPACE.pagePadX}px`, marginBottom: SPACE.sectionHeaderContent }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: eyebrowColor ?? V4.slate, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {eyebrow}
          </span>
          {subline && (
            <span style={{ fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
              {subline}
            </span>
          )}
        </div>
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
