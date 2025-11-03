/**
 * Tile Component
 * Consistent chrome with overflow guards and locked header height
 */

import React from 'react';

type TileProps = React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  variant?: 'compact' | 'content';
  right?: React.ReactNode;
  footer?: React.ReactNode;
}>;

export function Tile({ title, subtitle, right, children, footer, variant = 'compact' }: TileProps) {
  const minHeight = variant === 'compact' ? 'var(--hub-tile-compact)' : 'var(--hub-tile-content)';
  
  return (
    <section
      className="relative rounded-[var(--hub-radius)]"
      style={{
        background: 'var(--hub-surface-2)',
        border: '1px solid var(--hub-stroke)',
        minHeight,
        overflow: 'hidden',
      }}
    >
      {/* Header row (locked height) */}
      <div
        className="flex items-center justify-between"
        style={{ height: 'var(--hub-header-height)', padding: 'var(--hub-pad)' }}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-semibold leading-none text-white truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-white/70 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {right}
      </div>

      {/* Content */}
      <div className="px-[var(--hub-pad)] pb-[var(--hub-pad)]">
        {children}
      </div>

      {footer && (
        <div className="px-[var(--hub-pad)] pb-[var(--hub-pad)]">{footer}</div>
      )}
    </section>
  );
}
