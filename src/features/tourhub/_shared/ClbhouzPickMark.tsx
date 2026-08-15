import clbhouzLogo from '@/assets/clbhouz-logo.png';

/**
 * THE MARK THAT SAYS "THIS IS A clbhouz PICK".
 *
 * ONE COMPONENT, EVERY SURFACE. The hero board and the Tournament Intelligence
 * cards carry the SAME mark so a member reads them as the same statement — an
 * amber dot on one and a logo on the other would read as two unrelated things.
 *
 * The asset is already brand amber (#F7931E) with a transparent ground, so it
 * needs no tint. It sits INLINE, to the right of the player's name, and never
 * shrinks in a flex row.
 */
export function ClbhouzPickMark({ size = 11, label }: { size?: number; label: string }) {
  return (
    <img
      src={clbhouzLogo}
      alt=""
      role="img"
      aria-label={label}
      title={label}
      width={size}
      height={size}
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        display: 'block',
        objectFit: 'contain',
      }}
    />
  );
}
