import React from 'react';
import SquircleImage from '@/components/ui/SquircleImage';
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
    <div style={{ borderRadius: '14px' }}>
      <SquircleImage
        size={size}
        src={avatarUrl || '/placeholder.svg'}
        alt={displayName}
        ringColor="rgba(255,255,255,0.28)"
        ringWidth={1}
      />
    </div>
  );
}
