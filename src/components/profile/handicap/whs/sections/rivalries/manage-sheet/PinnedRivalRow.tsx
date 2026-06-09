import React from 'react';
import { Trash2, Pin } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  rivalry: FriendRivalryHydrated;
  onRemove: () => void;
  busy: boolean;
}

const FONT = 'Geist, system-ui, -apple-system, sans-serif';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const AMBER_TINT = 'rgba(247,147,30,0.10)';

export const PinnedRivalRow: React.FC<Props> = ({ rivalry, onRemove, busy }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 8px',
      borderBottom: '0.5px solid var(--hcp-line-2)',
      fontFamily: FONT,
    }}
  >
    <Avatar url={pickAvatarSrc(rivalry.rival_thumbnail_url, rivalry.rival_profile_photo_url)} name={rivalry.rival_name ?? ''} />
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
        {firstName(rivalry.rival_name ?? '')}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-60)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          HCP {fmtHcp(rivalry.rival_handicap)}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 6px',
            borderRadius: 999,
            background: AMBER_TINT,
            color: AMBER_DEEP,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.14em',
            border: '1px solid rgba(247,147,30,0.20)',
          }}
        >
          <Pin size={8} strokeWidth={2.6} />
          PINNED
        </span>
      </div>
    </div>
    <button
      onClick={onRemove}
      disabled={busy}
      aria-label={`Remove ${firstName(rivalry.rival_name ?? 'rival')}`}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: busy ? 'wait' : 'pointer',
        color: 'var(--hcp-bad)',
        opacity: busy ? 0.4 : 1,
      }}
    >
      <Trash2 size={16} strokeWidth={2.2} />
    </button>
  </div>
);

const Avatar: React.FC<{ url: string | null; name: string }> = ({ url, name }) => (
  <div
    style={{
      width: 34,
      height: 34,
      borderRadius: '34%',
      overflow: 'hidden',
      background: 'var(--hcp-bg-3)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {url ? (
      <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--hcp-t-60)' }}>
        {initials(name)}
      </span>
    )}
  </div>
);

export default PinnedRivalRow;
