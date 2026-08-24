import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface PodiumAvatarRingProps {
  avatarSize: number;
  src?: string | null;
  alt: string;
  userId?: string | null;
  ringColor: string;
  className?: string;
}

/**
 * The canonical Discover podium avatar construction.
 *
 * The wrapper is exactly 3px wider than the avatar. Centring the avatar leaves
 * 1.5px around it; a 1px ring inset against the wrapper edge therefore leaves
 * a visible 0.5px gap between avatar and ring. Both layers use the canonical
 * 1 / 1.05 avatar aspect and 34% squircle radius, so the ring traces the image.
 */
export function PodiumAvatarRing({
  avatarSize,
  src,
  alt,
  userId,
  ringColor,
  className,
}: PodiumAvatarRingProps) {
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        width: avatarSize + 3,
        aspectRatio: '1 / 1.05',
        borderRadius: '34%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      <SquircleAvatar
        src={src}
        userId={userId}
        alt={alt}
        size={avatarSize}
        hideRing
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '34%',
          boxShadow: `inset 0 0 0 1px ${ringColor}`,
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

export default PodiumAvatarRing;