import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';

/**
 * Canonical player-avatar resolver — single source of truth for every tour
 * page and subpage. DB photo_url wins; otherwise an ordered multi-folder
 * candidate list (event-tour folder first, then PGA Tour, then the rest).
 * Feed the result to <SquircleAvatar srcCandidates={...} />, which walks the
 * list and falls back to canonical initials when all miss.
 */
export function resolvePlayerAvatarCandidates(
  opts: {
    name?: string | null;
    photoUrl?: string | null;
    tourSlug?: string | null;
    /** Optional name-key override threaded to getPlayerHeadshotCandidates (admin uploads). */
    headshotOverride?: string | null;
  },
): string[] {
  const direct = opts.photoUrl ?? null;
  const name = (opts.name ?? '').trim();
  const tour = opts.tourSlug ?? 'pga';
  const override = opts.headshotOverride ?? null;
  const list = (name || override)
    ? (() => {
        try {
          return getPlayerHeadshotCandidates(name, tour, override);
        } catch {
          return [];
        }
      })()
    : [];
  return [direct, ...list]
    .filter((u): u is string => Boolean(u))
    .filter((u, i, a) => a.indexOf(u) === i);
}
