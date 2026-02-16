/**
 * WarmAvatar — Cleo-style avatar with gradient fallback and optional online indicator
 * Spec: Orange gradient fallback with initials, green online dot
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface WarmAvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  online?: boolean;
  className?: string;
}

export function WarmAvatar({ src, name = '', size = 36, online, className }: WarmAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const dotSize = Math.max(10, size * 0.28);

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold"
          style={{
            background: 'linear-gradient(135deg, #F97316, #FBBF24)',
            fontSize: size * 0.4,
          }}
        >
          {initial}
        </div>
      )}
      {online && (
        <div
          className="absolute bottom-0 right-0 rounded-full bg-[#22C55E] border-2"
          style={{
            width: dotSize,
            height: dotSize,
            borderColor: 'rgba(255,253,248,0.8)',
          }}
        />
      )}
    </div>
  );
}
