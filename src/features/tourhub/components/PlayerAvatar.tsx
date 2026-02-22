/**
 * PlayerAvatar - Displays player headshot from R2 CDN with fallback initials
 * 
 * Priority order:
 * 1. R2 CDN headshot (via getR2HeadshotUrlMultiTour)
 * 2. Initials fallback
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getR2HeadshotUrlMultiTour } from '@/utils/playerHeadshot';

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  /** @deprecated - no longer used, R2 is the single source */
  fallbackPhotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-3xl',
  '2xl': 'w-32 h-32 text-4xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PlayerAvatar({ 
  playerId, 
  playerName, 
  fallbackPhotoUrl, 
  size = 'md',
  className 
}: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const photoUrl = getR2HeadshotUrlMultiTour(playerName);
  const initials = getInitials(playerName);
  const showPhoto = photoUrl && !imageError;
  
  return (
    <div 
      className={cn(
        "bg-muted flex items-center justify-center shrink-0 overflow-hidden",
        SIZE_CLASSES[size],
        className
      )}
      style={{ borderRadius: '34%', aspectRatio: '1 / 1.05' }}
    >
      {showPhoto ? (
        <img 
          src={photoUrl} 
          alt={playerName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}

/**
 * Batch avatar display for leaderboards - uses R2 CDN
 */
interface BatchPlayerAvatarProps {
  playerId: string;
  playerName: string;
  /** @deprecated - no longer used */
  fallbackPhotoUrl?: string | null;
  /** @deprecated - no longer used */
  headshotMap?: Map<string, string>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function BatchPlayerAvatar({ 
  playerId, 
  playerName, 
  fallbackPhotoUrl,
  headshotMap,
  size = 'md',
  className 
}: BatchPlayerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const photoUrl = getR2HeadshotUrlMultiTour(playerName);
  const initials = getInitials(playerName);
  const showPhoto = photoUrl && !imageError;
  
  return (
    <div 
      className={cn(
        "bg-muted flex items-center justify-center shrink-0 overflow-hidden",
        SIZE_CLASSES[size],
        className
      )}
      style={{ borderRadius: '34%', aspectRatio: '1 / 1.05' }}
    >
      {showPhoto ? (
        <img 
          src={photoUrl} 
          alt={playerName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}
