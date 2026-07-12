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
import { useActorUnreadCounts } from '@/hooks/useActorUnreadCounts';

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
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            minWidth: 17,
            height: 17,
            padding: '0 5px',
            borderRadius: 999,
            background: AMBER,
            color: '#fff',
            fontWeight: 700,
            fontSize: 10,
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
  const { countFor } = useActorUnreadCounts();
  const actorTotal = countFor(actorType, actorId);
  // ActorCards displays actorTotal as a single per-card badge. The row's
  // Messages and Alerts tiles reuse the SAME per-actor total so the two
  // surfaces never disagree; we don't have a per-channel split available.
  const badge = actorTotal;

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
        badge={badge}
        onClick={() => onNavigate('/messages')}
      />
      <Tile
        label="Alerts"
        icon={<Bell size={17} color={INK} />}
        badge={badge}
        onClick={() => onNavigate('/notificationmessages')}
      />
    </div>
  );
}
