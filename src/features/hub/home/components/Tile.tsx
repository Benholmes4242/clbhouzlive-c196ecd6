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
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <section
      className="hub-card relative rounded-3xl p-4 pt-3.5 pb-3.5 flex flex-col min-h-[192px]"
      style={{
        background: 'var(--hub-glass)',
        border: '1px solid var(--hub-stroke)',
        boxShadow: '0 4px 22px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(var(--hub-blur))',
        WebkitBackdropFilter: 'blur(var(--hub-blur))',
        willChange: 'backdrop-filter',
        transition: 'background 0.2s ease-out',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--hub-glass)'}
    >
      <div className="flex-1">
        <div className="text-[20px] font-semibold mb-0.5" style={{ color: 'var(--hub-text)' }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[13px] mb-2.5 line-clamp-1" style={{ color: 'var(--hub-text-sub)' }}>
            {subtitle}
          </div>
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
              className="shrink-0 rounded-2xl px-3.5 py-2 text-[13px] transition"
              style={{
                border: '1px solid var(--hub-stroke-subtle)',
                color: 'var(--hub-text-body)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-subtle)'}
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
