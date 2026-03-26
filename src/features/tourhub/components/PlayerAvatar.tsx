/**
 * PlayerAvatar - Displays player headshot from R2 CDN with inline SVG silhouette fallback
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  tourCode?: string;
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

const SIZE_PX = { sm: 24, md: 32, lg: 48, xl: 72, '2xl': 96 };

export function PlayerAvatar({ 
  playerId, 
  playerName, 
  tourCode = 'pga',
  size = 'md',
  className 
}: PlayerAvatarProps) {
  const headshotUrl = getPlayerHeadshotUrl(playerName, tourCode);
  const [imgError, setImgError] = useState(false);
  
  return (
    <div 
      className={cn(
        "bg-muted flex items-center justify-center shrink-0 overflow-hidden",
        SIZE_CLASSES[size],
        className
      )}
      style={{ borderRadius: '34%', aspectRatio: '1 / 1.05' }}
    >
      {imgError ? (
        <PlayerSilhouette size={SIZE_PX[size]} />
      ) : (
        <img 
          src={headshotUrl} 
          alt={playerName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}

/**
 * Batch avatar display for leaderboards - uses R2 CDN
 */
export function BatchPlayerAvatar({ 
  playerId, 
  playerName, 
  tourCode = 'pga',
  size = 'md',
  className 
}: PlayerAvatarProps) {
  const headshotUrl = getPlayerHeadshotUrl(playerName, tourCode);
  const [imgError, setImgError] = useState(false);
  
  return (
    <div 
      className={cn(
        "bg-muted flex items-center justify-center shrink-0 overflow-hidden",
        SIZE_CLASSES[size],
        className
      )}
      style={{ borderRadius: '34%', aspectRatio: '1 / 1.05' }}
    >
      {imgError ? (
        <PlayerSilhouette size={SIZE_PX[size]} />
      ) : (
        <img 
          src={headshotUrl} 
          alt={playerName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
