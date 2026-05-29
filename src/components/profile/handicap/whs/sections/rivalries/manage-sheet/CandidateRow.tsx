import React from 'react';
import { Plus } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  candidate: FriendLeaderboardEntry;
  onAdd: () => void;
  busy: boolean;
}

const FONT = 'Geist, system-ui, -apple-system, sans-serif';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';

export const CandidateRow: React.FC<Props> = ({ candidate, onAdd, busy }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 8px',
      borderBottom: '1px solid var(--hcp-line-2)',
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: '34%',
        overflow: 'hidden',
        background: 'var(--hcp-bg-3)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {(() => {
        const src = pickAvatarSrc(candidate.friend_thumbnail_url, candidate.friend_profile_photo_url);
        return src ? (
          <img
            src={src}
            alt={candidate.friend_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--hcp-t-60)' }}>
            {initials(candidate.friend_name)}
          </span>
        );
      })()}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {firstName(candidate.friend_name)}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--hcp-t-60)', fontVariantNumeric: 'tabular-nums' }}>
        HCP {fmtHcp(candidate.friend_handicap_index)}
        {!candidate.is_clbhouz_user && (
          <span
            style={{
              marginLeft: 8,
              color: AMBER_DEEP,
              fontWeight: 700,
              letterSpacing: '0.14em',
              fontSize: 9,
            }}
          >
            INVITE
          </span>
        )}
      </p>
    </div>
    <button
      onClick={onAdd}
      disabled={busy}
      aria-label={`Add ${firstName(candidate.friend_name)} as rival`}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: AMBER,
        border: 'none',
        borderRadius: 999,
        cursor: busy ? 'wait' : 'pointer',
        color: '#fff',
        opacity: busy ? 0.5 : 1,
      }}
    >
      <Plus size={16} strokeWidth={2.6} />
    </button>
  </div>
);

export default CandidateRow;
