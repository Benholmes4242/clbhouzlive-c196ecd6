/**
 * GoldRingAvatar — SquircleAvatar wrapped in the canonical animated gold
 * gradient ring used for EXCEPTIONAL (>=9.0) review surfaces. Same visual
 * language as `clbhouz-gold-shimmer-bar` (see index.css).
 *
 * Used by Moments of the Game (Aces & Albatrosses podium + Latest honours)
 * and the legendary "See all" TierSeeAllSheet.
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

type SquircleAvatarProps = React.ComponentProps<typeof SquircleAvatar>;

interface GoldRingAvatarProps extends Omit<SquircleAvatarProps, 'hairlineRing' | 'ringColor'> {
  /** Ring thickness in px. Defaults to 1.5 (matches hairline ring visual weight). */
  ringWidth?: number;
}

export const GoldRingAvatar: React.FC<GoldRingAvatarProps> = ({
  size = 24,
  ringWidth = 1.5,
  ...rest
}) => {
  const numericSize = typeof size === 'number' ? size : 24;
  const outer = numericSize + ringWidth * 2;
  return (
    <div
      className="clbhouz-gold-shimmer-bar"
      style={{
        width: outer,
        height: outer,
        padding: ringWidth,
        borderRadius: '34%',
        flexShrink: 0,
        display: 'inline-block',
        lineHeight: 0,
      }}
      aria-hidden={false}
    >
      <SquircleAvatar size={numericSize} {...rest} />
    </div>
  );
};

export default GoldRingAvatar;
