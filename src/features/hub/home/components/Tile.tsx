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
    <section className="hub-card relative overflow-hidden flex flex-col min-h-[192px]">
      <div className="flex-1">
        <div className="text-[18px] font-semibold mb-0.5 hub-text-title">{title}</div>
        {subtitle && (
          <div className="text-[14px] mb-2.5 line-clamp-1 hub-text-subtitle">{subtitle}</div>
        )}
        <div className="mt-2.5">{children}</div>
      </div>

      {/* Footer bar with View all */}
      {(footer || onViewAll) && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">{footer}</div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="hub-btn-glass shrink-0 rounded-2xl px-3.5 py-2 text-[13px]"
              aria-label="View all"
            >
              View all →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
