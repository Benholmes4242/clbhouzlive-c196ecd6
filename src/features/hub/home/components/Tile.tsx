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
    <section className="hub-card relative overflow-hidden flex flex-col min-h-[192px] p-4 md:p-5">
      <div className="flex-1">
        <div className="hub-title text-[18px]">{title}</div>
        {subtitle && <div className="hub-sub text-[14px] mt-1 line-clamp-1">{subtitle}</div>}
        <div className="mt-4">{children}</div>
      </div>

      {/* Footer bar with View all */}
      {(footer || onViewAll) && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 min-w-0">{footer}</div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="shrink-0 rounded-2xl px-4 h-9 border border-white/15 hover:bg-white/10 transition"
              style={{ color: 'var(--hub-text)' }}
            >
              View all →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
