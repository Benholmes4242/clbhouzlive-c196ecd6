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

import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  tourCode?: string;
  /** Optional DB photo_url — tried FIRST before the name-based candidate chain. */
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  /** NO RING ON TOUR PLAYERS: a tour/pro player avatar renders with no ring
   *  or hairline at all, so none is drawn by default. The ONE exception is
   *  the amber pick ring, which arrives as `ringGradient` below. */
  ringColor?: string;
  /** sr_players.headshot_override — a FILENAME KEY for the folder lookup, not a
   *  URL. Never pass it as photoUrl and never coalesce the two. */
  headshotOverride?: string | null;
  /** Passed to SquircleAvatar. Defaults change nothing. */
  surface?: 'tile' | 'canvas';
  imagePosition?: string;
  /** Gradient drawn in the hairline's place (see SquircleAvatar.ringGradient). */
  ringGradient?: string;
}

const SIZE_PX = { xs: 26, sm: 32, md: 44, lg: 64, xl: 96, '2xl': 128 } as const;

export function PlayerAvatar({
  playerId,
  playerName,
  tourCode = 'pga',
  photoUrl,
  size = 'md',
  className,
  ringColor = DARK_HAIRLINE,
  headshotOverride = null,
  surface = 'tile',
  imagePosition = '50% 50%',
  ringGradient,
}: PlayerAvatarProps) {
  const candidates = resolvePlayerAvatarCandidates({
    name: playerName,
    photoUrl: photoUrl ?? null,
    tourSlug: tourCode,
    headshotOverride: headshotOverride ?? null,
  });
  return (
    <SquircleAvatar
      size={typeof size === 'number' ? size : SIZE_PX[size]}
      srcCandidates={candidates}
      alt={playerName}
      userId={playerId || playerName}
      hairlineRing
      ringColor={ringColor}
      className={className}
      surface={surface}
      imagePosition={imagePosition}
      ringGradient={ringGradient}
    />
  );
}

/** Back-compat alias — same component, kept for older call sites. */
export const BatchPlayerAvatar = PlayerAvatar;
