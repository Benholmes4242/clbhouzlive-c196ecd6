/**
 * Shared SectionShell — dispatch section header + optional right link.
 */

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { V4 } from '../tokens';

export function SectionShell({
  eyebrow,
  linkLabel,
  onLinkClick,
  children,
  amber = true,
}: {
  eyebrow: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  children: ReactNode;
  amber?: boolean;
}) {
  const color = amber ? V4.amber : V4.ink;
  return (
    <section style={{ padding: '20px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {eyebrow}
        </span>
        {linkLabel ? (
          <button
            onClick={onLinkClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', color, fontSize: 12, fontWeight: 700 }}
          >
            {linkLabel}
            <ChevronRight size={14} strokeWidth={2.4} />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
