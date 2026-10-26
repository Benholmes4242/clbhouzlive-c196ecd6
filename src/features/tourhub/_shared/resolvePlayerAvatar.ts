import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import rorySabbatini from '@/assets/players/rory-sabbatini.webp.asset.json';

/**
 * Canonical player-avatar resolver — single source of truth for every tour
 * page and subpage. DB photo_url wins; otherwise an ordered multi-folder
 * candidate list (PGA Tour folder first, then the event-tour folder, then the rest).
 * Feed the result to <SquircleAvatar srcCandidates={...}
                      />, which walks the
 * list and falls back to canonical initials when all miss.
 */
/** Uploaded headshots keyed by normalised player name; tried before every other source. */
const PLAYER_PHOTO_UPLOADS: Record<string, string> = {
  'rory sabbatini': rorySabbatini.url,
};
const normName = (n: string) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export function uploadedPlayerPhoto(name?: string | null): string | null {
  return name ? PLAYER_PHOTO_UPLOADS[normName(name)] ?? null : null;
}

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
  return [uploadedPlayerPhoto(name), direct, ...list]
    .filter((u): u is string => Boolean(u))
    .filter((u, i, a) => a.indexOf(u) === i);
}
