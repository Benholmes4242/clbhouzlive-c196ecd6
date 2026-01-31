/**
 * PlayerAvatar - Displays player headshot with fallback initials
 * 
 * Priority order:
 * 1. sr_players.photo_url (real headshots from storage)
 * 2. player_media.headshot_url (if not ui-avatars.com)
 * 3. Initials fallback
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePlayerHeadshot } from '../hooks/usePlayerMedia';
import { resolvePhotoUrl } from '../utils/resolvePhotoUrl';

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  /** Fallback photo URL from sr_players.photo_url - this is the primary source */
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
  const { data: headshotUrl } = usePlayerHeadshot(playerId);
  
  // Priority: sr_players.photo_url (resolved) > player_media.headshot_url (resolved) > initials
  const primaryPhotoUrl = resolvePhotoUrl(fallbackPhotoUrl);
  const secondaryPhotoUrl = resolvePhotoUrl(headshotUrl);
  const finalPhotoUrl = primaryPhotoUrl || secondaryPhotoUrl;
  
  const initials = getInitials(playerName);
  
  // Show photo if available and not errored
  const showPhoto = finalPhotoUrl && !imageError;
  
  return (
    <div className={cn(
      "rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden",
      SIZE_CLASSES[size],
      className
    )}>
      {showPhoto ? (
        <img 
          src={finalPhotoUrl} 
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
 * Batch avatar display for leaderboards - uses pre-fetched headshot map
 */
interface BatchPlayerAvatarProps {
  playerId: string;
  playerName: string;
  fallbackPhotoUrl?: string | null;
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
  
  // Priority: sr_players.photo_url > headshotMap > initials
  const primaryPhotoUrl = resolvePhotoUrl(fallbackPhotoUrl);
  const secondaryPhotoUrl = resolvePhotoUrl(headshotMap?.get(playerId));
  const finalPhotoUrl = primaryPhotoUrl || secondaryPhotoUrl;
  
  const initials = getInitials(playerName);
  
  const showPhoto = finalPhotoUrl && !imageError;
  
  return (
    <div className={cn(
      "rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden",
      SIZE_CLASSES[size],
      className
    )}>
      {showPhoto ? (
        <img 
          src={finalPhotoUrl} 
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
