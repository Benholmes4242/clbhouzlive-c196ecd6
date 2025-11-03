/**
 * Tile Header Component
 * Reusable header for Hub dashboard tiles
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TileHeaderProps {
  title: string;
  subtitle?: string;
  viewAllTo?: string;
  rightSlot?: React.ReactNode;
}

export function TileHeader({ title, subtitle, viewAllTo, rightSlot }: TileHeaderProps) {
  const nav = useNavigate();
  
  return (
    <div className="tile-header">
      <div>
        <div className="tile-title">{title}</div>
        {subtitle ? <div className="eyebrow">{subtitle}</div> : null}
      </div>
      {rightSlot ?? (
        viewAllTo ? (
          <button 
            type="button"
            className="row link" 
            onClick={() => nav(viewAllTo)}
            aria-label={`View all ${title}`}
          >
            View all <span className="chev">›</span>
          </button>
        ) : null
      )}
    </div>
  );
}
