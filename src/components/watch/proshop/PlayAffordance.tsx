import { memo } from 'react';
import { Play } from 'lucide-react';

interface PlayAffordanceProps {
  /** Diameter in px. Defaults to 40 (rail tiles). Heroes use 56. */
  size?: number;
  /**
   * Visual weight.
   * - `solid` (default): solid scrim, NO backdrop-filter (mobile-perf safe).
   * - `outlined`: same scrim plus a 1px hairline white stroke (heroes).
   */
  variant?: 'solid' | 'outlined';
}

/**
 * Pro Shop primitive — canonical centred play affordance used across Watch,
 * Clips and Videos tile/rail/hero surfaces. Solid scrim only (no
 * backdrop-blur) per `mem://constraints/mobile-performance-rendering`.
 */
function PlayAffordanceInner({ size = 40, variant = 'solid' }: PlayAffordanceProps) {
  const iconSize = Math.round(size * 0.4);
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.6)',
        border: variant === 'outlined' ? '1px solid rgba(255,255,255,0.18)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Play
        size={iconSize}
        fill="white"
        stroke="white"
        strokeWidth={1}
        style={{ marginLeft: Math.max(1, Math.round(iconSize * 0.08)) }}
      />
    </div>
  );
}

export const PlayAffordance = memo(PlayAffordanceInner);
