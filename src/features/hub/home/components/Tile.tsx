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
}>;

export function Tile({ title, subtitle, children, onViewAll, footer }: TileProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <section
      className="relative rounded-3xl p-3.5 pb-3 overflow-hidden flex flex-col"
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
      {/* Header */}
      <div className="mb-2">
        <h3 className="text-[17px] font-bold leading-tight tracking-tight" style={{ color: 'var(--hub-text)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] mt-0.5 line-clamp-1 opacity-70" style={{ color: 'var(--hub-text-sub)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col min-h-0">{children}</div>

      {/* Footer - simplified for compact layout */}
      {(footer || onViewAll) && (
        <>
          <div 
            className="h-px my-2"
            style={{
              background: 'rgba(255,255,255,0.08)',
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">{footer}</div>
            {onViewAll && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAll();
                }}
                className="shrink-0 text-[12px] font-medium transition"
                style={{
                  color: 'var(--hub-text-body)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
              >
                View all →
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
