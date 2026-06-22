/**
 * PlayerAvatar — unified tour player avatar.
 *
 * Delegates to the canonical SquircleAvatar so every tour player avatar
 * behaves identically across the app:
 *   - Tries the event-tour folder FIRST (1 request for native players)
 *   - On miss, walks the cross-tour fallback chain (PGA, LIV, DPWT, KFT,
 *     PGA Champions, LPGA) so a player whose photo lives in a different
 *     home folder still resolves to their real headshot.
 *   - When every candidate misses, shows the canonical 2-letter initials
 *     on the deterministic slate/graphite palette — same fallback as the
 *     Clubhouse and Handicap pages.
 *
 * Do NOT fork this avatar. New tour sections should use this component
 * (or SquircleAvatar with `srcCandidates`) so the fallback stays unified.
 */

import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  tourCode?: string;
  /** Optional DB photo_url — tried FIRST before the name-based candidate chain. */
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const SIZE_PX = { xs: 26, sm: 32, md: 44, lg: 64, xl: 96, '2xl': 128 } as const;

export function PlayerAvatar({
  playerId,
  playerName,
  tourCode = 'pga',
  photoUrl,
  size = 'md',
  className,
}: PlayerAvatarProps) {
  const nameCandidates = getPlayerHeadshotCandidates(playerName, tourCode);
  // DB photo_url wins (matches the hero's resolveAvatar priority); then name-based chain.
  const candidates = photoUrl ? [photoUrl, ...nameCandidates] : nameCandidates;
  return (
    <SquircleAvatar
      size={SIZE_PX[size]}
      srcCandidates={candidates}
      alt={playerName}
      userId={playerId || playerName}
      hideRing
      className={className}
    />
  );
}

/** Back-compat alias — same component, kept for older call sites. */
export const BatchPlayerAvatar = PlayerAvatar;
