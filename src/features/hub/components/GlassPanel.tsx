/**
 * GlassPanel - Reusable glass surface component
 * Matches "Your Games" tile aesthetic with smoke glass effect
 */

import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function GlassPanel({ children, className = '', as: Component = 'section' }: GlassPanelProps) {
  return (
    <Component
      className={`
        rounded-3xl
        bg-[var(--hub-glass-bg)]/60
        backdrop-blur-md
        border border-[var(--hub-stroke)]/50
        shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_8px_30px_rgba(0,0,0,0.35)]
        text-[var(--hub-text)]
        overflow-hidden
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </Component>
  );
}
