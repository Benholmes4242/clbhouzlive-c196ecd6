import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface PodiumAvatarRingProps {
  avatarSize: number;
  src?: string | null;
  alt: string;
  userId?: string | null;
  ringColor: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The canonical Discover podium avatar construction.
 *
 * The wrapper is exactly 4px wider than the avatar so the image lands on whole
 * CSS pixels at 1× resolution. The ring is inset by 0.5px; its 1px border ends
 * 1.5px in, leaving a visible 0.5px gap before the avatar begins at 2px. This
 * avoids the asymmetric rasterisation caused by centring with a 1.5px offset.
 * Both layers use the canonical 1 / 1.05 aspect and 34% squircle radius.
 */
export function PodiumAvatarRing({
  avatarSize,
  src,
  alt,
  userId,
  ringColor,
  className,
  style,
}: PodiumAvatarRingProps) {
  return (
    <span
      data-podium-avatar-ring
      className={className}
      style={{
        position: 'relative',
        width: avatarSize + 4,
        aspectRatio: '1 / 1.05',
        borderRadius: '34%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          display: 'flex',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <SquircleAvatar
          src={src}
          userId={userId}
          alt={alt}
          size={avatarSize}
          hideRing
        />
      </span>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0.5,
          borderRadius: '34%',
          border: `1px solid ${ringColor}`,
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

export default PodiumAvatarRing;