/**
 * HubTile - Shared tile chrome component
 * Consistent header, body, divider, footer pattern
 */

import React from 'react';

type HubTileProps = {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export default function HubTile({ title, subtitle, footer, children }: HubTileProps) {
  return (
    <>
      <header className="tile-header">
        <h2>{title}</h2>
        {subtitle && <p className="tile-sub">{subtitle}</p>}
      </header>
      <div className="tile-body">{children}</div>
      <div className="tile-divider" />
      {footer && <div className="tile-footer">{footer}</div>}
    </>
  );
}
