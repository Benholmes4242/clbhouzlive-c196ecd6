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
  align?: 'start' | 'center';
  withFooter?: boolean;
  ref?: React.Ref<HTMLElement>;
}>;

export const Tile = React.forwardRef<HTMLElement, Omit<TileProps, 'ref'>>(
  ({ title, subtitle, children, onViewAll, footer, align = 'start', withFooter = false }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const hasFooter = withFooter || !!(footer || onViewAll);

    return (
      <section
        ref={ref}
        className={`HubTile ${hasFooter ? 'HubTile--withFooter' : ''} relative rounded-3xl p-4 pt-3.5 pb-0 overflow-hidden flex flex-col h-full`}
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          willChange: 'transform, backdrop-filter',
          transform: 'translateZ(0)',
          transition: 'box-shadow 0.2s ease-out',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      <div className="flex-1 flex flex-col">
        <div 
          className="text-[20px] font-semibold mb-0.5" 
          style={{ 
            color: 'var(--hub-text)',
            textAlign: align === 'center' ? 'center' : 'left'
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div 
            className="text-[13px] mb-2.5 line-clamp-1" 
            style={{ 
              color: 'var(--hub-text-sub)',
              textAlign: align === 'center' ? 'center' : 'left'
            }}
          >
            {subtitle}
          </div>
        )}
        <div className="flex-1 flex flex-col">{children}</div>
      </div>

      {/* Footer rendered via children - new system uses HubTileFooter */}
      {footer}
    </section>
  );
});
