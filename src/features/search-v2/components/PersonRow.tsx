import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import type { PersonHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { ROW_BASE, S } from '../lib/tokens';

interface Props { person: PersonHit; query: string; onSelect: () => void }

export function PersonRow({ person, query, onSelect }: Props) {
  const name = person.display_name ?? person.username ?? 'Unknown';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={ROW_BASE}
    >
      <SquircleAvatar
        src={person.profile_photo_url ?? undefined}
        alt={name}
        userId={person.id}
        size={42}
        hairlineRing
        ringColor={DARK_HAIRLINE}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate" style={{ color: S.INK }}>
          <Highlight text={name} query={query} />
        </p>
        {person.username && (
          <p className="text-[12px] truncate" style={{ color: S.QUIET }}>
            @{person.username}
          </p>
        )}
      </div>
    </button>
  );
}
