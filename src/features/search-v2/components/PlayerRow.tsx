import type { PlayerHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { ResultTile } from './ResultTile';
import { ROW_BASE, S } from '../lib/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';

interface Props { player: PlayerHit; query: string; onSelect: () => void }

export function PlayerRow({ player, query, onSelect }: Props) {
  // `tourSlug: 'pga'` is NOT a claim that this is a PGA player. The resolver
  // tries the PGA folder first regardless, then every other folder (LPGA
  // included), so a name alone resolves on any tour. Do not thread a tour
  // through the search payload to "fix" this.
  const candidates = resolvePlayerAvatarCandidates({ name: player.full_name, photoUrl: null, tourSlug: 'pga' });
  return (
    <button
      type="button"
      onClick={onSelect}
      className={ROW_BASE}
    >
      <ResultTile>
        <SquircleAvatar size={44} srcCandidates={candidates} alt={player.full_name} userId={player.id} hideRing />
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
