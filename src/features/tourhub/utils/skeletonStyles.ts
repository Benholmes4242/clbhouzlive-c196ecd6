/**
 * Shared shimmer primitive for Tour Hero + Player Scorecard skeletons.
 * Inject SHIMMER_KEYFRAMES once at the surface level via a <style> tag.
 */
import type { CSSProperties } from 'react';

export const SHIMMER_BG = `
  linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 0%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.04) 100%
  )
`;

export const SHIMMER_KEYFRAMES = `
  @keyframes heroShimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

export const shimmerStyle: CSSProperties = {
  background: SHIMMER_BG,
  backgroundSize: '200% 100%',
  animation: 'heroShimmer 1.6s ease-in-out infinite',
};
