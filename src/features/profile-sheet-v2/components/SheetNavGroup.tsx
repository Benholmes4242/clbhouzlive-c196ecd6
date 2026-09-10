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
  /** D2: false puts "Create a business profile" under the business row. */
  hasBusinessActor?: boolean;
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
  hasBusinessActor = true,

}: Props) {
  const showAnalytics = currentActor.type === 'personal' && !!onOpenCourseAnalytics;
  /* BRIEF_ACCOUNT_SHEET_REBUILD C — COURSE ANALYTICS IS NOT DIMMED.
     It is a real button, it has never been `disabled`, and tapping it opens the
     connect flow. Rendering it at 0.55 told the member it does nothing, which
     is the opposite of true and cost them the feature entirely: nobody taps a
     row they have been told is off. The subtitle now states what the tap does,
     and the chevron honestly means navigation. */
  const analyticsSubLabel =
    analyticsState === 'ready'
      ? 'Your game, course by course'
      : analyticsState === 'building'
        ? 'Your analytics build as your rounds sync'
        : 'Connect your handicap to see your game course by course.';
  const handleAnalyticsTap = () => {
    if (analyticsState === 'disconnected') {
      /* BRIEF_ACCOUNT_SHEET_REBUILD F — /manage/handicap, not /handicap.
         /handicap is the DASHBOARD route; it only showed the connect flow as a
         fall-through for members with no connection, so the moment a member
         connects that destination silently changes meaning. The island
         (ChromeIsland) and the teaser card (HcpStrip) both use
         /manage/handicap; this row now agrees with them. The CONNECTED branch
         is unchanged — it opens the analytics sheet. */
      onNavigate('/manage/handicap');
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
          // Full opacity in every state (C). `disabled` stays on Row for a
          // genuinely inert future row; this one is not one.
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
      {/* BRIEF_ACCOUNT_SHEET_REBUILD D2 — the dashed "+ Business" tile moved
          off the identity switcher and landed HERE, as the subtitle on the
          existing business row. Creating a business is account creation, not an
          identity, and it already had a door to the same route; a second row
          would have been two doors to one destination. */}
      <Row
        label="Manage businesses"
        subLabel={hasBusinessActor ? undefined : 'Create a business profile'}
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
