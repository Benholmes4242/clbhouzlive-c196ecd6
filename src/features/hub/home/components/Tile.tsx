/**
 * Tile Component
 * Reusable glass tile with Apple-style polish
 */

import React from 'react';

interface TileProps {
  children: React.ReactNode;
  className?: string;
}

export function Tile({ children, className = '' }: TileProps) {
  return (
    <div
      className={`w-full rounded-3xl p-4 md:p-5 transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,.08)_inset,0_12px_40px_rgba(0,0,0,.55)] hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.03))] ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 1px 0 rgba(255,255,255,.06) inset, 0 8px 32px rgba(0,0,0,.45)',
      }}
    >
      {children}
    </div>
  );
}
