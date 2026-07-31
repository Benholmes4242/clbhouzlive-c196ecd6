import type { ClubHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { ResultTile, TILE_INITIALS } from './ResultTile';

interface Props { club: ClubHit; query: string; onSelect: () => void }

export function ClubRow({ club, query, onSelect }: Props) {
  const initial = (club.name?.[0] ?? '?').toUpperCase();
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02] text-left"
    >
      <ResultTile white={!!club.logo_url}>
        {club.logo_url ? (
          <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span style={TILE_INITIALS}>{initial}</span>
        )}
      </ResultTile>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate" style={{ color: '#0F172A' }}>
          <Highlight text={club.name} query={query} />
        </p>
        {club.city && (
          <p className="text-[12px] truncate" style={{ color: '#475569' }}>
            {club.city}
          </p>
        )}
      </div>
    </button>
  );
}
