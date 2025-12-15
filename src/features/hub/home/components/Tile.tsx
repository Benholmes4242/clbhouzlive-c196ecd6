/**
 * Tile Component
 * Light theme paper-card style
 */

import React from 'react';

type TileProps = React.PropsWithChildren<{
  title: string | React.ReactNode;
  subtitle?: string;
  onViewAll?: () => void;
  footer?: React.ReactNode;
  align?: 'start' | 'center';
}>;

export function Tile({ title, subtitle, children, onViewAll, footer, align = 'start' }: TileProps) {
  return (
    <section
      className="hub-light-tile relative rounded-[22px] px-4 pt-3 pb-4 overflow-hidden flex flex-col min-h-0 h-full"
      style={{
        background: 'var(--hub-light-card-bg)',
        border: '1px solid var(--hub-light-card-border)',
        boxShadow: 'var(--hub-light-card-shadow)',
      }}
    >
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          className="text-[20px] font-semibold mb-0.5" 
          style={{ 
            color: 'var(--hub-light-text-primary)',
            textAlign: align === 'center' ? 'center' : 'left'
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div 
            className="text-[13px] mb-2 line-clamp-1" 
            style={{ 
              color: 'var(--hub-light-text-secondary)',
              textAlign: align === 'center' ? 'center' : 'left'
            }}
          >
            {subtitle}
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0" style={{ marginTop: '2.5px' }}>{children}</div>
      </div>

      {/* Footer bar with View all */}
      {(footer || onViewAll) && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 min-w-0">{footer}</div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="shrink-0 rounded-2xl px-3.5 py-2 text-[13px] transition"
              style={{
                border: '1px solid var(--hub-light-card-border)',
                color: 'var(--hub-light-text-secondary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-light-pill-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              View all →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
