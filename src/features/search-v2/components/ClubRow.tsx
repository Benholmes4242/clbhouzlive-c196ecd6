import type { ClubHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { ResultTile } from './ResultTile';
import { ROW_BASE, S } from '../lib/tokens';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { avatarFallbackFill, AVATAR_FALLBACK_INK, getInitialsFromName } from '@/lib/avatarFallback';

interface Props { club: ClubHit; query: string; onSelect: () => void }

export function ClubRow({ club, query, onSelect }: Props) {
  const initials = getInitialsFromName(club.name) || '?';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={ROW_BASE}
    >
      {club.logo_url ? (
        /* White plate survives only under logo art — see ResultTile. */
        <ResultTile white>
          <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
        </ResultTile>
      ) : (
        /* No logo: the canonical dark fallback fill with first/last initials.
           Same 44px size, radius 13 and border as ResultTile. */
        <div
          className="relative overflow-hidden shrink-0 flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: avatarFallbackFill(club.id),
            border: `1px solid ${A.BORDER}`,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: AVATAR_FALLBACK_INK }}>{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate" style={{ color: S.INK }}>
          <Highlight text={club.name} query={query} />
        </p>
        {club.city && (
          <p className="text-[13px] truncate" style={{ color: S.QUIET }}>
            {club.city}
          </p>
        )}
      </div>
    </button>
  );
}
