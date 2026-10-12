/**
 * ProfileSheetV2 · identity header (A). One button to the member's profile;
 * it replaces the "View profile" nav row — two doors to one place is the fault
 * this app keeps producing. Avatar is SquircleAvatar at 46px with its ring.
 */
import React from 'react';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

// Brief value; the amber has no token owner yet (see AGENTS.md).
const AMBER_PILL_BORDER = 'rgba(247,147,30,0.34)';

const IdentityHeader: React.FC<{
  id: string;
  name: string;
  avatarUrl?: string;
  line: string | null;
  onOpen: () => void;
}> = ({ id, name, avatarUrl, line, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    data-identity-header
    style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 22px 14px',
      background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left', fontFamily: SANS,
    }}
  >
    <SquircleAvatar size={46} src={avatarUrl} alt={name} userId={id} hairlineRing ringColor={DARK_HAIRLINE} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.025em', color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
      {line && (
        <div style={{ fontSize: 12.5, color: A.DIM, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line}</div>
      )}
    </div>
    {/* V3 A.1 — the NAMED door. Decoration only: the whole header is the tap target. */}
    <span data-view-profile-pill style={{
      flex: 'none', whiteSpace: 'nowrap', pointerEvents: 'none',
      fontSize: 11.5, fontWeight: 800, letterSpacing: '0.04em', color: A.AMBER,
      border: `1px solid ${AMBER_PILL_BORDER}`, borderRadius: 999, padding: '5px 10px 5px 11px',
    }}>View profile {'\u203A'}</span>
  </button>
);

export default IdentityHeader;
