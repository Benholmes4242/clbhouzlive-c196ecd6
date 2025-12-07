import React from "react";
import { SquircleAvatar, SquircleAvatarSize } from "./SquircleAvatar";

type Props = {
  size?: SquircleAvatarSize;    // pixel value or variant (default: 'md')
  src?: string | null;          // optional - if not provided, fallback will be shown
  alt?: string;
  ringColor?: string;           // optional border ring
  ringWidth?: number;           // deprecated - use ringColor instead
  className?: string;           // extra positioning classes
  fallback?: string;            // fallback text (e.g., initials)
  children?: React.ReactNode;   // badges (e.g., status dot) or custom content
  onLoad?: () => void;          // callback when image loads
  priority?: boolean;           // eager loading for above-fold avatars
};

/**
 * ⚠️ DEPRECATED - USE <SquircleAvatar /> INSTEAD ⚠️
 * 
 * ❌ DO NOT use AvatarSquircle - it is deprecated
 * ✅ MUST use <SquircleAvatar> from @/components/ui/SquircleAvatar.tsx
 * 
 * GLOBAL AVATAR RING RULE:
 * - Users WITH achievement ring: 2px colored ring directly on avatar (no grey ring)
 * - Users WITHOUT achievement ring: 2px grey ring
 * 
 * @deprecated Use <SquircleAvatar> from @/components/ui/SquircleAvatar.tsx instead
 */
export default function AvatarSquircle({
  size = 'md',
  src,
  alt = "",
  ringColor,
  ringWidth = 0,
  className = "",
  fallback,
  children,
  onLoad,
  priority = false
}: Props) {
  // DEPRECATED warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ DEPRECATED: AvatarSquircle is deprecated!\n' +
      '✅ Use <SquircleAvatar> from @/components/ui/SquircleAvatar.tsx instead.'
    );
  }

  // Use ringColor if provided, otherwise use ringWidth > 0 for backwards compatibility
  const effectiveRingColor = ringColor || (ringWidth > 0 ? '#D1D5DB' : null);

  return (
    <SquircleAvatar
      size={size}
      src={src}
      alt={alt}
      ringColor={effectiveRingColor}
      fallback={fallback}
      className={className}
      onLoad={onLoad}
      priority={priority}
    >
      {children}
    </SquircleAvatar>
  );
}
