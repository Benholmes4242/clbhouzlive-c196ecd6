/**
 * Shared resolver for tour player avatar candidates.
 * Single source of truth used by the hero (CinematicFrame) and the
 * PlayerScorecardSheet so both surfaces share one ordered candidate chain.
 */
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';

function entryName(e: any): string {
  const p = e?.player;
  return p?.full_name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || '—';
}

export function resolveAvatarCandidates(e: any, tourSlug?: string | null): string[] {
  return resolvePlayerAvatarCandidates({
    name: entryName(e),
    photoUrl: e?.player?.photo_url ?? null,
    tourSlug: tourSlug ?? null,
  });
}
