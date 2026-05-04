/**
 * Shared "Editorial Broadcast" tokens + primitives used by:
 *   - Tour Hero (live + results states) — HeroCarousel
 *   - Player Scorecard — PlayerScorecardCard
 *
 * Tokens align with the Tournament Intelligence section. See
 * mem://features/tour-hub/tournament-intelligence-authority.
 *
 * The atmospheric background is a layered radial-glow + linear navy ramp +
 * inline-SVG grain hint. It is non-interactive and adds ~600 bytes to bundle.
 *
 * The <Shimmer/> primitive is the project's single skeleton placeholder for
 * these surfaces. Pixel widths are forbidden in skeletons except for circles
 * (avatars, dots, icons). Use percentages, flex, or clamp() everywhere else.
 */

import React from 'react';

// ── Atmosphere ──────────────────────────────────────────────────────────────
export const navy        = '#0B1220';
export const navyMid     = '#0F1726';
export const navyHigh    = '#15203A';
export const ink         = '#0F172A';

// Foreground on navy
export const inkOnNavy   = 'rgba(255,255,255,0.96)';
export const inkSoft     = 'rgba(255,255,255,0.72)';
export const inkFaint    = 'rgba(255,255,255,0.42)';
export const inkGhost    = 'rgba(255,255,255,0.22)';
export const hairlineDark = 'rgba(255,255,255,0.08)';
export const hairlineMid  = 'rgba(255,255,255,0.14)';

// Section + state colours
export const amber       = '#F7931E';
export const amberDeep   = '#D97706';
export const gold        = '#FFB800';
export const goldDeep    = '#D97706';
export const greenLive   = '#10B981';
export const danger      = '#F87171';

export const headlineFont = '"Geist", -apple-system, BlinkMacSystemFont, sans-serif';

// ── Atmosphere wrapper ──────────────────────────────────────────────────────
export const ATMOSPHERE_RADIAL = `radial-gradient(900px 500px at 50% -120px, ${navyHigh} 0%, transparent 60%), linear-gradient(180deg, ${navyMid} 0%, ${navy} 100%)`;
const GRAIN_SVG = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

/** Two stacked absolute layers: navy ramp + radial glow, then 4% grain. */
export function AtmosphereLayers() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: ATMOSPHERE_RADIAL,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          opacity: 0.04, pointerEvents: 'none',
          backgroundImage: GRAIN_SVG,
        }}
      />
    </>
  );
}

// ── Shimmer primitive ───────────────────────────────────────────────────────
export const SHIMMER_KEYFRAMES = `
@keyframes hero-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes hero-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
  50%      { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
}
`;

const shimmerBase: React.CSSProperties = {
  background: `linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)`,
  backgroundSize: '200% 100%',
  animation: 'hero-shimmer 1.6s ease-in-out infinite',
};

export interface ShimmerProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}

export function Shimmer({ width, height, radius = 6, style = {} }: ShimmerProps) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        borderRadius: radius,
        ...shimmerBase,
        ...style,
      }}
    />
  );
}

// ── Score formatter ─────────────────────────────────────────────────────────
export function fmtScore(s: number | null | undefined): string {
  if (s == null) return '—';
  if (s === 0) return 'E';
  if (s > 0) return `+${s}`;
  return `−${Math.abs(s)}`;
}
