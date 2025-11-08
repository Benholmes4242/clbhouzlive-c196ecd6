import React from 'react';
import './nearby.css';

interface GolferAvatarProps {
  avatarUrl?: string;
  displayName: string;
  size?: number;
}

export function GolferAvatar({ 
  avatarUrl, 
  displayName, 
  size = 48 
}: GolferAvatarProps) {
  return (
    <span className="g-avatar" style={{ width: size, height: size }}>
      <img
        src={avatarUrl || '/placeholder.svg'}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
