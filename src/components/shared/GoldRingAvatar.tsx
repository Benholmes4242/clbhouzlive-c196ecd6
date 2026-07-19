/**
 * GoldRingAvatar — SquircleAvatar wrapped in a soft animated gold radiant
 * glow. Uses the canonical 1px hairline ring in exceptional gold for Aces &
 * Albatrosses moments and legendary "See all" sheets.
 *
 * The old padding-based outer shimmer ring has been removed so the avatar
 * carries a single canonical ring (not a double/triple border).
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { GOLD } from '@/components/explore-tab-new/gamingLightTokens';

type SquircleAvatarProps = React.ComponentProps<typeof SquircleAvatar>;

interface GoldRingAvatarProps extends Omit<SquircleAvatarProps, 'hairlineRing' | 'ringColor'> {}

export const GoldRingAvatar: React.FC<GoldRingAvatarProps> = ({
  size = 24,
  ...rest
}) => {
  const numericSize = typeof size === 'number' ? size : 24;
  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{
        width: numericSize,
        height: numericSize,
      }}
      aria-hidden={false}
    >
      {/* Soft animated gold radiant glow behind the avatar */}
      <div
        className="clbhouz-gold-shimmer-bar absolute pointer-events-none"
        style={{
          inset: -2,
          borderRadius: '34%',
          filter: 'blur(2px)',
          opacity: 0.55,
        }}
      />
      <SquircleAvatar
        size={numericSize}
        hairlineRing
        ringColor={GOLD}
        {...rest}
      />
    </div>
  );
};

export default GoldRingAvatar;
