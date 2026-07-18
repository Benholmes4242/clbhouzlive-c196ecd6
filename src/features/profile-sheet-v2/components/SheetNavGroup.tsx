/**
 * ProfileSheetV2 · SheetNavGroup
 *
 * Grouped card with View profile / Manage businesses / Settings and Manage Profile, plus
 * an admin-only Command Center row. Route strings verbatim from
 * src/components/profile/ProfileHubSheet.tsx (via its opener
 * PostingAsMenu.handleAccountHubNavigate):
 *   View profile             -> `/profile/${currentActor.id}`
 *   Manage businesses        -> '/businesses/manage'
 *   Settings and Manage Profile -> '/edit-profile?tab=settings'
 *   Command Center           -> '/admin/command-center'
 */

import React from 'react';

const INK = '#0F172A';
const MUTED = '#94A3B8';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CHEVRON = '\u203A';

interface Props {
  currentActor: { id: string; type: 'personal' | 'business' };
  isAdmin: boolean;
  onNavigate: (route: string) => void;
}

interface RowProps {
  label: string;
  onClick: () => void;
  trailing?: React.ReactNode;
  isLast?: boolean;
}

function Row({ label, onClick, trailing, isLast }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:scale-[0.99]"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 16px',
        background: 'transparent',
        border: 0,
        borderBottom: isLast ? 0 : `0.5px solid ${HAIRLINE}`,
        cursor: 'pointer',
        transition: 'transform 120ms ease',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 13.5, color: INK }}>{label}</span>
      {trailing ?? <span style={{ color: MUTED, fontSize: 16 }}>{CHEVRON}</span>}
    </button>
  );
}

export default function SheetNavGroup({ currentActor, isAdmin, onNavigate }: Props) {
  return (
    <div
      style={{
        margin: '12px 20px 0',
        background: '#fff',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Row
        label="View profile"
        onClick={() => onNavigate(`/profile/${currentActor.id}`)}
      />
      <Row
        label="Manage businesses"
        onClick={() => onNavigate('/businesses/manage')}
      />
      <Row
        label="Settings"
        onClick={() => onNavigate('/edit-profile?tab=settings')}
        isLast={!isAdmin}
      />
      {isAdmin && (
        <Row
          label="Command Center"
          onClick={() => onNavigate('/admin/command-center')}
          isLast
          trailing={
            <span
              style={{
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: '0.1em',
                color: AMBER,
              }}
            >
              ADMIN
            </span>
          }
        />
      )}
    </div>
  );
}
