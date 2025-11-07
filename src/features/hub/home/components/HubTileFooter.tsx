/**
 * Shared Hub Tile Footer Component
 * Ensures consistent positioning: divider 32px from bottom, CTA centered at 16px
 */

import React from 'react';

type HubTileFooterProps = {
  cta?: React.ReactNode;
  divider?: boolean;
  className?: string;
};

export function HubTileFooter({
  cta,
  divider = true,
  className = "",
}: HubTileFooterProps) {
  return (
    <div className={`HubTileFooterLayer ${className}`} aria-hidden={!cta && !divider}>
      {cta && (
        <div className="HubTileFooterCTA">
          {cta}
        </div>
      )}
    </div>
  );
}
