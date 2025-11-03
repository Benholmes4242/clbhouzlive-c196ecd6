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
      className="hub-card relative rounded-3xl p-4 pt-3.5 pb-3.5 overflow-hidden flex flex-col min-h-[192px]"
      style={{
        background: 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 4px 22px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        willChange: 'transform, backdrop-filter',
        transform: 'translateZ(0)',
        transition: 'background 0.2s ease-out',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
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
