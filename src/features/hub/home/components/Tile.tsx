/**
 * Tile Component
 * Consistent chrome with View all in footer
 */

import React from 'react';

type TileProps = React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  footer?: React.ReactNode;
}>;

export function Tile({ title, subtitle, children, onViewAll, footer }: TileProps) {
  return (
    <section
      className="relative overflow-hidden flex flex-col min-h-[192px] transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'var(--hub-glass-bg)',
        border: '1px solid var(--hub-stroke)',
        borderRadius: 'var(--hub-radius)',
        backdropFilter: 'var(--hub-glass-blur)',
        boxShadow: 'var(--hub-shadow-inner), var(--hub-shadow)',
        padding: '16px 20px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--hub-glass-bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--hub-glass-bg)';
      }}
    >
      <div className="flex-1">
        <div className="text-[18px] font-semibold mb-0.5" style={{ color: 'var(--hub-text-title)' }}>{title}</div>
        {subtitle && <div className="text-[14px] mb-2.5 line-clamp-1" style={{ color: 'var(--hub-text-sub)' }}>{subtitle}</div>}
        <div className="mt-2.5">{children}</div>
      </div>

      {/* Footer bar with View all */}
      {(footer || onViewAll) && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">{footer}</div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="shrink-0 rounded-2xl px-3.5 py-2 text-[13px] transition"
              style={{
                border: '1px solid var(--hub-stroke)',
                background: 'var(--hub-glass-bg)',
                color: 'var(--hub-text)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hub-glass-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--hub-glass-bg)';
              }}
            >
              View all →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
