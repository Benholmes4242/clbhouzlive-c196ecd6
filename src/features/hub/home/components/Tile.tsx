/**
 * Tile Component
 * Consistent chrome with View all in footer
 */

import React from 'react';

type TileProps = React.PropsWithChildren<{
  title: string | React.ReactNode;
  subtitle?: string;
  onViewAll?: () => void;
  footer?: React.ReactNode;
  className?: string;
}>;

export function Tile({ title, subtitle, children, onViewAll, footer, className }: TileProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <section
      className="relative rounded-3xl p-4 pt-3.5 pb-3.5 overflow-hidden flex flex-col min-h-[192px]"
      style={{
        background: 'linear-gradient(180deg, var(--hub-glass-bg-start), var(--hub-glass-bg-end))',
        border: '1px solid var(--hub-stroke)',
        boxShadow: isHovered 
          ? 'var(--hub-shadow-tile-hover), var(--hub-shadow-tile-inset), var(--hub-top-highlight)'
          : 'var(--hub-shadow-tile), var(--hub-shadow-tile-inset), var(--hub-top-highlight)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        willChange: 'transform, backdrop-filter',
        transform: 'translateZ(0)',
        transition: 'box-shadow 0.2s ease-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {className ? (
        // Custom layout mode - children control everything except title
        <>
          <div className="text-[20px] font-semibold mb-0.5" style={{ color: 'var(--hub-text)' }}>
            {title}
          </div>
          {subtitle && (
            <div className="text-[13px] mb-2.5 line-clamp-1" style={{ color: 'var(--hub-text-sub)' }}>
              {subtitle}
            </div>
          )}
          <div className={className}>{children}</div>
        </>
      ) : (
        // Default layout mode
        <div className="flex-1 flex flex-col">
          <div className="text-[20px] font-semibold mb-0.5" style={{ color: 'var(--hub-text)' }}>
            {title}
          </div>
          {subtitle && (
            <div className="text-[13px] mb-2.5 line-clamp-1" style={{ color: 'var(--hub-text-sub)' }}>
              {subtitle}
            </div>
          )}
          <div className="flex-1 flex flex-col">{children}</div>
        </div>
      )}

      {/* Footer bar with View all */}
      {(footer || onViewAll) && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">{footer}</div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="shrink-0 rounded-2xl px-3.5 py-2 text-[13px] transition"
              style={{
                border: '1px solid var(--hub-stroke-strong)',
                color: 'var(--hub-text-body)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-bg-button)'}
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
