import React from 'react';
import { ATMOSPHERE_BG, GRAIN_BG_IMAGE } from '../../utils/heroAtmosphere';

/**
 * <HeroAtmosphere> — wrapper that lays down the shared editorial-broadcast
 * background (radial glow + navy ramp + 4% grain) behind its children.
 *
 * Children render at z-index 2 above the atmosphere layers. The wrapper
 * controls only the background; layout/padding stays in the consumer.
 */
export function HeroAtmosphere({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      {/* atmospheric base */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: ATMOSPHERE_BG,
        }}
      />
      {/* grain overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: GRAIN_BG_IMAGE,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}
