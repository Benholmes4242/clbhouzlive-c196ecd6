import React from 'react';
import { prefersReduced } from '@/lib/ui/motion';
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
    <span className="avatar-wrap relative shrink-0" style={{ width: size, height: size }}>
      <img
        src={avatarUrl || '/placeholder.svg'}
        alt=""
        className="avatar-img w-full h-full object-cover rounded-full"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
