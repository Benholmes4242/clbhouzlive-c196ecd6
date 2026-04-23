import { memo } from 'react';

interface PinProps {
  children: React.ReactNode;
  /**
   * Visual variant.
   * - `dark`   — black scrim, white text. Used for course/format/duration
   *              badges on top of media.
   * - `light`  — white scrim, slate text. Used on light surfaces.
   * - `amber`  — black scrim, brand-amber text, slightly tighter type.
   *              Used for surfacing badges (NEW, POPULAR REVIEW, …).
   */
  variant?: 'dark' | 'light' | 'amber';
  icon?: React.ReactNode;
  /**
   * Size variant.
   * - `md` — default. ~22px tall.
   * - `sm` — compact. ~18px tall, used for ranked/surfacing badges.
   */
  size?: 'sm' | 'md';
}

/**
 * Pro Shop primitive — canonical badge/chip used across Watch, Clips and
 * Videos surfaces. Renders course names, durations, formats, and surfacing
 * reasons on top of media tiles.
 *
 * Note (Phase 1c, platform rule): no `backdrop-filter: blur()` here. We use
 * solid colour-with-opacity scrims instead — see
 * `mem://constraints/mobile-performance-rendering`.
 */
function PinInner({ children, variant = 'dark', icon, size = 'md' }: PinProps) {
  const isLight = variant === 'light';
  const isAmber = variant === 'amber';
  const isCompact = size === 'sm';

  const background = isLight
    ? 'rgba(255,255,255,0.95)'
    : 'rgba(0,0,0,0.55)';
  const color = isLight
    ? '#0F172A'
    : isAmber
    ? '#F7931E'
    : 'rgba(255,255,255,0.95)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: isCompact ? '0 7px' : '4px 8px',
        height: isCompact ? 18 : undefined,
        borderRadius: 6,
        background,
        color,
        fontSize: isCompact ? 9 : 11,
        fontWeight: isAmber ? 700 : 600,
        lineHeight: 1.2,
        letterSpacing: isAmber ? '0.08em' : undefined,
        textTransform: isAmber ? 'uppercase' : undefined,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {icon ? <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span> : null}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
    </div>
  );
}

export const Pin = memo(PinInner);
