/**
 * PlayerAvatar - Displays player headshot from R2 CDN with silhouette fallback
 * 
 * Uses getPlayerHeadshotUrl which always returns a valid URL
 * (silhouette placeholder when tour code unknown).
 */

import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  /** Tour code for R2 folder lookup. Falls back to silhouette if omitted. */
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

export function PlayerAvatar({ 
  playerId, 
  playerName, 
  tourCode = 'pga',
  size = 'md',
  className 
}: PlayerAvatarProps) {
  const headshotUrl = getPlayerHeadshotUrl(playerName, tourCode);
  
  return (
    <div 
      className={cn(
        "bg-muted flex items-center justify-center shrink-0 overflow-hidden",
        SIZE_CLASSES[size],
        className
      )}
      style={{ borderRadius: '34%', aspectRatio: '1 / 1.05' }}
    >
      <img 
        src={headshotUrl} 
        alt={playerName}
        className="w-full h-full object-cover object-top"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
      />
    </div>
  );
}

/**
 * Batch avatar display for leaderboards - uses R2 CDN
 */
interface BatchPlayerAvatarProps {
  playerId: string;
  playerName: string;
  tourCode?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function BatchPlayerAvatar({ 
  playerId, 
  playerName, 
  tourCode = 'pga',
  size = 'md',
  className 
}: BatchPlayerAvatarProps) {
  const headshotUrl = getPlayerHeadshotUrl(playerName, tourCode);
  
  return (
    <div 
      className={cn(
        "bg-muted flex items-center justify-center shrink-0 overflow-hidden",
        SIZE_CLASSES[size],
        className
      )}
      style={{ borderRadius: '34%', aspectRatio: '1 / 1.05' }}
    >
      <img 
        src={headshotUrl} 
        alt={playerName}
        className="w-full h-full object-cover object-top"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
      />
    </div>
  );
}
