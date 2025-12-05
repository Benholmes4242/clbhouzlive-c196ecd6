import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import './nearby.css';

interface GolferAvatarProps {
  avatarUrl?: string;
  displayName: string;
  size?: number;
  /** Achievement ring color (optional) */
  ringColor?: string | null;
}

/**
 * GolferAvatar - Uses the global SquircleAvatar component
 * New squircle spec: 1/1.05 aspect ratio, 34% border radius
 */
export function GolferAvatar({ 
  avatarUrl, 
  displayName, 
  size = 52,
  ringColor
}: GolferAvatarProps) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <SquircleAvatar
      src={avatarUrl}
      alt={displayName}
      size={size}
      fallback={initials}
      ringColor={ringColor}
    />
  );
}
