/**
 * ProfileSheetV2 · QuickActionsRow
 *
 * Three tiles: Echo / Messages / Alerts.
 * Badges: Messages sums per-conversation unread from useConversations (the
 * same RPC the inbox renders); Alerts reads useUnreadNotifications. These
 * are intentionally the same sources as the destination pages so tile
 * badges cannot drift from what those pages show.
 * Route strings copied verbatim from src/components/profile/ProfileHubSheet.tsx:
 *   Echo     -> '/echo'
 *   Messages -> '/messages'
 *   Alerts   -> '/notificationmessages'
 */

import React from 'react';
import { Sparkles, Mail, Bell } from 'lucide-react';
import { useConversations } from '@/hooks/messaging/useConversations';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

import { A } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  actorType: 'personal' | 'business';
  actorId: string;
  onNavigate: (route: string) => void;
}

interface TileProps {
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick: () => void;
}

function Tile({ label, icon, badge, onClick }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:scale-[0.98]"
      style={{
        position: 'relative',
        flex: 1,
        background: A.PANEL,
        border: `1px solid ${A.BORDER}`,
        borderRadius: 16,
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        cursor: 'pointer',
        transition: 'transform 120ms ease',
      }}
    >
      {icon}
      <span style={{ fontWeight: 600, fontSize: 13, color: A.INK }}>{label}</span>
      {badge != null && badge > 0 && (
        <span
          aria-label={`${badge} unread`}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 999,
            // ON THIS SHEET A NOTIFICATION COUNT IS WHITE: ground A.INK,
            // figure A.CANVAS. Amber still means the viewing member app-wide
            // and still marks a business actor on the actor cards; a count is
            // not either of those things, so it does not take amber.
            background: A.INK,
            color: A.CANVAS,
            fontWeight: 700,
            fontSize: 11,
            fontVariantNumeric: 'tabular-nums',
            border: `2px solid ${A.PANEL}`,
            boxSizing: 'content-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export default function QuickActionsRow({ actorType, actorId, onNavigate }: Props) {
  // Messages: sum of per-conversation unread from the same RPC the inbox uses,
  // so the badge cannot drift from what the Messages page renders.
  const { conversations } = useConversations();
  const messagesBadge = (conversations ?? []).reduce(
    (sum, c) => sum + (c.unread_count ?? 0),
    0,
  );
  // Alerts: notifications-only for the active actor (bell definition).
  const { unreadCount: alertsBadge } = useUnreadNotifications();

  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0' }}>
      <Tile
        label="Echo"
        icon={<Sparkles size={17} color={A.INK} />}
        onClick={() => onNavigate('/echo')}
      />
      <Tile
        label="Messages"
        icon={<Mail size={17} color={A.INK} />}
        badge={messagesBadge}
        onClick={() => onNavigate('/messages')}
      />
      <Tile
        label="Alerts"
        icon={<Bell size={17} color={A.INK} />}
        badge={alertsBadge}
        onClick={() => onNavigate('/notificationmessages')}
      />
    </div>
  );
}
