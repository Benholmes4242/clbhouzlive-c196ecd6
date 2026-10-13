import { useEffect, useMemo, useState } from 'react';
import type { PlayerHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { ResultTile, TILE_INITIALS } from './ResultTile';
import { ROW_BASE, S } from '../lib/tokens';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';

interface Props { player: PlayerHit; query: string; onSelect: () => void }

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function PlayerRow({ player, query, onSelect }: Props) {
  // `tourSlug: 'pga'` is NOT a claim that this is a PGA player. The resolver
  // tries the PGA folder first regardless, then every other folder (LPGA
  // included), so a name alone resolves on any tour. Do not thread a tour
  // through the search payload to "fix" this.
  const candidates = useMemo(
    () => resolvePlayerAvatarCandidates({ name: player.full_name, photoUrl: null, tourSlug: 'pga' }),
    [player.full_name],
  );
  // The photo is drawn straight into the ONE search tile; the initials span is
  // the tile's own fallback, so a miss keeps the TRACK plate, BORDER and MUTE
  // initials exactly like every other search row. No avatar background here.
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setIndex(0); setLoaded(false); }, [candidates]);
  const src = candidates[index];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={ROW_BASE}
    >
      <ResultTile>
        {!loaded ? (
          <span style={{ ...TILE_INITIALS, letterSpacing: '0.02em' }}>
            {initials(player.full_name)}
          </span>
        ) : null}
        {src ? (
          <img
            key={src}
            src={src}
            alt=""
            decoding="async"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(false); setIndex((i) => i + 1); }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: loaded ? 1 : 0 }}
          />
        ) : null}
      </ResultTile>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate" style={{ color: S.INK }}>
          <Highlight text={player.full_name} query={query} />
        </p>
        <p className="text-[13px] truncate" style={{ color: S.QUIET }}>
          {player.country ?? 'Tour player'}
        </p>
      </div>
    </button>
  );
}
