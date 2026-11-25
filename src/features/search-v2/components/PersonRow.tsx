import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { ProMemberName } from '@/features/pro-verification/ProLabel';
import type { PersonHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';
import { ROW_BASE, S } from '../lib/tokens';

/** subline: Brief 26 override (undefined → @username as before). */
interface Props { person: PersonHit; query: string; onSelect: () => void; subline?: string | null }

export function PersonRow({ person, query, onSelect, subline }: Props) {
  const sub = subline === undefined ? (person.username ? `@${person.username}` : null) : subline;
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
        <ProMemberName userId={person.id}><p className="text-[15px] font-medium truncate" style={{ color: S.INK }}>
          <Highlight text={name} query={query} />
        </p></ProMemberName>
        {sub && (
          <p className="text-[13px] truncate" style={{ color: S.QUIET }}>
            {sub}
          </p>
        )}
      </div>
    </button>
  );
}
