import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import type { ClubHit } from '../lib/searchNavigation';
import { Highlight } from './Highlight';

const AMBER = '#F7931E';

interface Props { club: ClubHit; query: string; onSelect: () => void }

export function ClubRow({ club, query, onSelect }: Props) {
  const initial = (club.name?.[0] ?? '?').toUpperCase();
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02] text-left"
    >
      <div
        className="relative w-[42px] h-[42px] rounded-[12px] overflow-hidden shrink-0 flex items-center justify-center"
        style={{
          background: club.logo_url ? '#fff' : 'rgba(247,147,30,0.14)',
          color: AMBER,
          fontSize: 16,
          fontWeight: 800,
        }}
      >
        {club.logo_url ? (
          <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[12px]"
          style={{ border: `1px solid ${LIGHT_HAIRLINE}` }}
        />
      </div>
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
