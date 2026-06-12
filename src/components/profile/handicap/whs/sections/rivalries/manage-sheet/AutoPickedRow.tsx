import React from 'react';
import { Pin, X } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  rivalry: FriendRivalryHydrated;
  onPin: () => void;
  onDismiss: () => void;
  busy: boolean;
}

const FONT = 'Geist, system-ui, -apple-system, sans-serif';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';

export const AutoPickedRow: React.FC<Props> = ({ rivalry, onPin, onDismiss, busy }) => (
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
      {(() => {
        const src = pickAvatarSrc(rivalry.rival_thumbnail_url, rivalry.rival_profile_photo_url);
        return src ? (
          <img
            src={src}
            alt={rivalry.rival_name ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--hcp-t-60)' }}>
            {initials(rivalry.rival_name ?? '')}
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
        {firstName(rivalry.rival_name ?? '')}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
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
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--hcp-t-40)',
          }}
        >
          AUTO
        </span>
      </div>
    </div>
    <button
      onClick={onPin}
      disabled={busy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'transparent',
        border: `1px solid ${AMBER}`,
        color: AMBER,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.14em',
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.5 : 1,
        fontFamily: FONT,
      }}
    >
      <Pin size={11} strokeWidth={2.4} />
      PIN
    </button>
    <button
      onClick={onDismiss}
      disabled={busy}
      aria-label={`Stop suggesting ${firstName(rivalry.rival_name ?? 'rival')}`}
      style={{
        width: 32,
        height: 32,
        marginLeft: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: busy ? 'wait' : 'pointer',
        color: 'var(--hcp-t-60)',
        opacity: busy ? 0.4 : 1,
      }}
    >
      <X size={16} strokeWidth={2.2} />
    </button>
  </div>
);

export default AutoPickedRow;
