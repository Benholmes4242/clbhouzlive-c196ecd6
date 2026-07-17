/**
 * ProfileSheetV2 · QuickActionsRow
 *
 * Three tiles: Echo / Messages / Alerts. Badges (Messages, Alerts) come
 * from the CURRENT actor's per-actor counts via useActorUnreadCounts —
 * same source ActorCards reads, so numbers agree.
 *
 * Route strings copied verbatim from src/components/profile/ProfileHubSheet.tsx:
 *   Echo     -> '/echo'
 *   Messages -> '/messages'
 *   Alerts   -> '/notificationmessages'
 */

import React from 'react';
import { Sparkles, Mail, Bell } from 'lucide-react';
import { useConversations } from '@/hooks/messaging/useConversations';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

const INK = '#0F172A';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(15,23,42,0.08)';

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
        background: '#fff',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 14,
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
      <span style={{ fontWeight: 600, fontSize: 11.5, color: INK }}>{label}</span>
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
            background: AMBER,
            color: '#fff',
            fontWeight: 700,
            fontSize: 10,
            fontVariantNumeric: 'tabular-nums',
            border: '2px solid #fff',
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
        icon={<Sparkles size={17} color={INK} />}
        onClick={() => onNavigate('/echo')}
      />
      <Tile
        label="Messages"
        icon={<Mail size={17} color={INK} />}
        badge={messagesBadge}
        onClick={() => onNavigate('/messages')}
      />
      <Tile
        label="Alerts"
        icon={<Bell size={17} color={INK} />}
        badge={alertsBadge}
        onClick={() => onNavigate('/notificationmessages')}
      />
    </div>
  );
}
