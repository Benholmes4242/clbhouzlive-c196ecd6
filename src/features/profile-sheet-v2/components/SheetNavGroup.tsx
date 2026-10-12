/**
 * ProfileSheetV2 · SheetNavGroup — four rows (BRIEF_PROFILE_SHEET_REBUILD G):
 *   Invite friends     -> invite sheet
 *   Manage businesses  -> '/businesses/manage'
 *   Settings           -> '/edit-profile?tab=settings'
 *   Command centre     -> '/admin/command-center' (admin only, ADMIN tag)
 *
 * "View profile" is gone: the identity header is that door (A.4).
 * "Course analytics" is gone: the Your courses card is that door (E.5).
 *
 * THE 0.55 LESSON. Rendering a live row at reduced opacity told the member it
 * does nothing, which is the opposite of true and cost them the feature
 * entirely. Nothing here is dimmed to indicate state; a row either does
 * something at full strength or is not rendered. Row has no `disabled` prop.
 */

import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const CHEVRON = '\u203A';

interface Props {
  gutter: number;
  currentActor: { id: string; type: 'personal' | 'business' };
  isAdmin: boolean;
  onNavigate: (route: string) => void;
  onInviteFriends?: () => void;
  /** The member's business names; empty puts "Create a business profile" under the row. */
  businessNames: string[];
}

function Row({ label, onClick, trailing, subLabel }: { label: string; onClick: () => void; trailing?: React.ReactNode; subLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:scale-[0.99]"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '15px 2px',
        background: 'transparent', border: 0, borderBottom: `1px solid ${A.TRACK}`,
        cursor: 'pointer', transition: 'transform 120ms ease', textAlign: 'left',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: A.INK }}>{label}</div>
        {subLabel && <div style={{ fontSize: 12, color: A.DIM, marginTop: 2 }}>{subLabel}</div>}
      </div>
      {/* A tag OR a chevron — never both. */}
      {trailing ?? <span style={{ color: A.DIM, fontSize: 17, lineHeight: 1 }}>{CHEVRON}</span>}
    </button>
  );
}

export default function SheetNavGroup({ gutter, currentActor, isAdmin, onNavigate, onInviteFriends, businessNames }: Props) {
  return (
    <div data-sheet-nav style={{ margin: `4px ${gutter}px 0`, borderTop: `1px solid ${A.TRACK}` }}>
      {currentActor.type === 'personal' && onInviteFriends && (
        <Row label="Invite friends" subLabel="Share clbhouz and build your circle" onClick={onInviteFriends} />
      )}
      <Row
        label="Manage businesses"
        subLabel={businessNames.length > 0 ? businessNames.join(', ') : 'Create a business profile'}
        onClick={() => onNavigate('/businesses/manage')}
      />
      <Row label="Settings" subLabel="Account, privacy and notifications" onClick={() => onNavigate('/edit-profile?tab=settings')} />
      {isAdmin && (
        <Row
          label="Command centre"
          onClick={() => onNavigate('/admin/command-center')}
          trailing={<span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: A.DIM }}>Admin</span>}
        />
      )}
    </div>
  );
}
