import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { PersonHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';

interface Props { person: PersonHit; query: string; onSelect: () => void }

export function PersonRow({ person, query, onSelect }: Props) {
  const name = person.display_name ?? person.username ?? 'Unknown';
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02] text-left"
    >
      <SquircleAvatar
        src={person.profile_photo_url ?? undefined}
        alt={name}
        userId={person.id}
        size={42}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate" style={{ color: '#0F172A' }}>
          <Highlight text={name} query={query} />
        </p>
        {person.username && (
          <p className="text-[12px] truncate" style={{ color: '#475569' }}>
            @{person.username}
          </p>
        )}
      </div>
    </button>
  );
}
