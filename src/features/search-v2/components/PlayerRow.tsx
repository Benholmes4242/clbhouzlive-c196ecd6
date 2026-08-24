import type { PlayerHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { ResultTile, TILE_INITIALS } from './ResultTile';
import { ROW_BASE, S } from '../lib/tokens';

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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={ROW_BASE}
    >
      <ResultTile>
        <span style={{ ...TILE_INITIALS, letterSpacing: '0.02em' }}>
          {initials(player.full_name)}
        </span>
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
