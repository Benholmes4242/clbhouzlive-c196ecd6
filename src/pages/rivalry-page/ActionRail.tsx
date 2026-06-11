import React from 'react';
import {
  MessageCircle,
  User as UserIcon,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import { FONT, BG_1, T80, T100, LINE } from './_shared/tokens';

interface Props {
  onMessage: () => void;
  onProfile: () => void;
  onShare: () => void;
}

export const ActionRail: React.FC<Props> = ({
  onMessage,
  onProfile,
  onShare,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 8,
      padding: '0 16px',
    }}
  >
    <ActionButton Icon={MessageCircle} label="Message" onClick={onMessage} />
    <ActionButton Icon={UserIcon} label="Profile" onClick={onProfile} />
    <ActionButton Icon={Share2} label="Share" onClick={onShare} />
  </div>
);

const ActionButton: React.FC<{
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
}> = ({ Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: '11px 0',
      background: BG_1,
      border: `0.5px solid ${LINE}`,
      borderRadius: 12,
      color: T100,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: FONT,
      letterSpacing: '0.02em',
    }}
  >
    <Icon size={14} strokeWidth={2.2} color={T80} />
    {label}
  </button>
);
