import React from 'react';
import { Squircle } from '@/components/ui/squircle';
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
    <Squircle width={size} height={size}>
      <img
        src={avatarUrl || '/placeholder.svg'}
        alt={displayName}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </Squircle>
  );
}
