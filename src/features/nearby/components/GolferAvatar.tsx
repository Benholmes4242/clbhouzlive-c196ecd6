import React from 'react';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import './nearby.css';

interface GolferAvatarProps {
  avatarUrl?: string;
  displayName: string;
  size?: number;
}

export function GolferAvatar({ 
  avatarUrl, 
  displayName, 
  size = 52 
}: GolferAvatarProps) {
  return (
    <AvatarSquircle
      src={avatarUrl}
      alt={displayName}
      fallback={displayName}
      size={size}
      ringWidth={1}
      ringColor="rgba(255,255,255,0.28)"
    />
  );
}
