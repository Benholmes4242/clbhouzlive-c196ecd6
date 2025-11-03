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
      className="hub-card relative p-4 pt-3.5 pb-3.5 overflow-hidden flex flex-col min-h-[192px] transition-all duration-300"
      style={{
        background: 'var(--hub-surface)',
        border: '1px solid var(--hub-stroke)',
        borderRadius: 'var(--hub-radius)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.08), 0 4px 24px rgba(0, 0, 0, 0.5)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--hub-surface-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--hub-surface)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex-1">
        <div className="text-[20px] font-semibold text-white mb-0.5">{title}</div>
        {subtitle && <div className="text-[13px] text-white/70 mb-2.5 line-clamp-1">{subtitle}</div>}
        <div className="mt-2.5">{children}</div>
      </div>

      {/* Footer bar with View all */}
      {(footer || onViewAll) && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">{footer}</div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="shrink-0 rounded-2xl px-3.5 py-2 text-[13px] border border-white/15 text-white/85 hover:bg-white/08 transition"
            >
              View all →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
