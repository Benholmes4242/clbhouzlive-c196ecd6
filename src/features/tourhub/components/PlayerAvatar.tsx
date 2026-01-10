/**
 * PlayerAvatar - Displays player headshot with fallback initials
 * Uses player_media table for high-quality headshots
 */

import { cn } from '@/lib/utils';
import { usePlayerHeadshot } from '../hooks/usePlayerMedia';

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  /** Fallback photo URL from sr_players.photo_url */
  fallbackPhotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-3xl',
};

export function PlayerAvatar({ 
  playerId, 
  playerName, 
  fallbackPhotoUrl, 
  size = 'md',
  className 
}: PlayerAvatarProps) {
  const { data: headshotUrl } = usePlayerHeadshot(playerId);
  
  // Use headshot from player_media, fallback to sr_players.photo_url, then initials
  const photoUrl = headshotUrl || fallbackPhotoUrl;
  
  const initials = playerName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  return (
    <div className={cn(
      "rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden",
      SIZE_CLASSES[size],
      className
    )}>
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt={playerName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}

/**
 * Batch avatar display for leaderboards - uses pre-fetched headshot map
 */
interface BatchPlayerAvatarProps {
  playerId: string;
  playerName: string;
  fallbackPhotoUrl?: string | null;
  headshotMap?: Map<string, string>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  // Use headshot from map if available, otherwise fallback
  const photoUrl = headshotMap?.get(playerId) || fallbackPhotoUrl;
  
  const initials = playerName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  return (
    <div className={cn(
      "rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden",
      SIZE_CLASSES[size],
      className
    )}>
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt={playerName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}
