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

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { LABEL as LABEL_METRICS } from '@/lib/tokens/type';

/** Canonical metrics; this surface keeps its own ink (set per call site). */
const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.DIM };

const CHEVRON = '\u203A';

type AnalyticsState = 'ready' | 'building' | 'disconnected';

interface Props {
  currentActor: { id: string; type: 'personal' | 'business' };
  isAdmin: boolean;
  onNavigate: (route: string) => void;
  onInviteFriends?: () => void;
  /** Course analytics entry — omit to hide the row. */
  onOpenCourseAnalytics?: () => void;
  analyticsState?: AnalyticsState;
}

interface RowProps {
  label: string;
  onClick: () => void;
  trailing?: React.ReactNode;
  isLast?: boolean;
  subLabel?: string;
  disabled?: boolean;
}

function Row({ label, onClick, trailing, isLast, subLabel, disabled }: RowProps) {
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
        padding: '13px 0',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        transition: 'transform 120ms ease',
        opacity: disabled ? 0.55 : 1,
        textAlign: 'left',
      }}
    >
      <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: A.INK }}>{label}</div>
        {subLabel && (
          <div style={{ fontWeight: 500, fontSize: 13, color: A.MUTE, marginTop: 2 }}>
            {subLabel}
          </div>
        )}
      </div>
      {/* A tag OR a chevron — never both. */}
      {trailing ?? (
        <span style={{ color: A.INK, fontSize: 16, fontWeight: 700 }}>{CHEVRON}</span>
      )}
    </button>
  );
}

export default function SheetNavGroup({
  currentActor,
  isAdmin,
  onNavigate,
  onInviteFriends,
  onOpenCourseAnalytics,
  analyticsState = 'disconnected',
}: Props) {
  const showAnalytics = currentActor.type === 'personal' && !!onOpenCourseAnalytics;
  const analyticsSubLabel =
    analyticsState === 'ready'
      ? 'Your game, course by course'
      : analyticsState === 'building'
        ? 'Your analytics build as your rounds sync'
        : 'Sync your official WHS handicap for live course analytics';
  const analyticsDisabled = analyticsState === 'disconnected';
  const handleAnalyticsTap = () => {
    if (analyticsState === 'disconnected') {
      onNavigate('/handicap');
      return;
    }
    onOpenCourseAnalytics?.();
  };

  return (
    <div
      style={{
        margin: '12px 20px 0',
        background: A.PANEL,
        border: `1px solid ${A.BORDER}`,
        borderRadius: 16,
        padding: '4px 16px',
      }}
    >
      <Row
        label="View profile"
        onClick={() => onNavigate(`/profile/${currentActor.id}`)}
      />
      {showAnalytics && (
        <Row
          label="Course analytics"
          subLabel={analyticsSubLabel}
          onClick={handleAnalyticsTap}
          disabled={analyticsDisabled}
          // No trailing tag: this row takes the same chevron as View profile,
          // Invite friends and Manage businesses. The old amber "New" badge
          // replaced the chevron, making this the one row without one.
          // `trailing` itself stays — Command Center's "Admin" tag uses it.
        />
      )}
      {currentActor.type === 'personal' && onInviteFriends && (
        <Row
          label="Invite friends"
          subLabel="Share clbhouz and build your circle"
          onClick={onInviteFriends}
        />
      )}
      <Row
        label="Manage businesses"
        onClick={() => onNavigate('/businesses/manage')}
      />
      <Row
        label="Settings and Manage Profile"
        onClick={() => onNavigate('/edit-profile?tab=settings')}
        isLast={!isAdmin}
      />
      {isAdmin && (
        <Row
          label="Command Center"
          onClick={() => onNavigate('/admin/command-center')}
          isLast
          trailing={
            <span style={{ ...LABEL, fontSize: 11, color: A.MUTE }}>Admin</span>
          }
        />
      )}
    </div>
  );
}
