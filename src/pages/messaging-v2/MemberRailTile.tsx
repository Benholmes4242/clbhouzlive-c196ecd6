/**
 * ONE RAIL TILE for Messages: optional bubble above, 56px SquircleAvatar,
 * first name below. Shared by the inbox Played-with rail and the group
 * thread's Playing off rail so the two cannot drift. The scroll container is
 * the existing `.msg-rail` class at each call site.
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MSG } from '@/features/messaging-dark/tokens';

interface Props {
  avatarUrl: string | null;
  userId: string | null;
  name: string;
  label: string;
  bubble?: React.ReactNode;
  width?: number;
  nameGap?: number;
  hairlineRing?: boolean;
  onClick?: () => void;
}

export const MemberRailTile: React.FC<Props> = ({
  avatarUrl, userId, name, label, bubble, width = 62, nameGap = 5, hairlineRing, onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="active:opacity-60"
    style={{ width, flex: 'none', background: 'transparent', border: 'none', padding: 0, textAlign: 'center' }}
  >
    {bubble ?? null}
    <div style={{ width: 56, height: 56, margin: '0 auto' }}>
      <SquircleAvatar src={avatarUrl} alt={name} userId={userId ?? undefined} size={56} hairlineRing={hairlineRing} />
    </div>
    <div style={{ marginTop: nameGap, fontSize: 11, color: MSG.INK_2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {label}
    </div>
  </button>
);

export default MemberRailTile;
