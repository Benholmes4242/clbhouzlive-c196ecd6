import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface GolferAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  /** Achievement ring color (optional) */
  ringColor?: string | null;
}

/**
 * GolferAvatar - Uses the global SquircleAvatar component
 * New squircle spec: 1/1.05 aspect ratio, 34% border radius
 */
export function GolferAvatar({ name, photoUrl, size = 56, ringColor }: GolferAvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <SquircleAvatar
      src={photoUrl}
      alt={name}
      size={size}
      fallback={initials}
      ringColor={ringColor}
    />
  );
}
