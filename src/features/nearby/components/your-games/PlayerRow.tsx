import * as React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { Participant } from './types';
import { formatHcp } from '@/lib/formatHcp';

interface PlayerRowProps {
  p: Participant;
  isHost?: boolean;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({ p, isHost }) => {
  const name = p.username ? `@${p.username}` : (p.display_name ?? 'Unknown');
  const hcpLabel = p.eg_handicap_index != null ? `HCP ${formatHcp(p.eg_handicap_index)}` : '';
  
  return (
    <div
      className="flex items-center gap-3.5 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2"
      role="listitem"
    >
      {/* Avatar */}
      <Squircle width={42} height={42}>
        <img
          src={p.profile_photo_url || '/placeholder.svg'}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </Squircle>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-medium text-white/90">{name}</span>
          {isHost && (
            <span className="text-[11px] px-2 py-[2px] rounded-full bg-white/10 border border-white/15 text-white/70">
              Host
            </span>
          )}
        </div>
        <div className="text-xs text-white/70 truncate">
          {[p.home_club, hcpLabel]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
    </div>
  );
};
