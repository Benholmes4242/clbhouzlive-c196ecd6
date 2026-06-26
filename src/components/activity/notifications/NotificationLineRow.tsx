import React from 'react';
import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  getActorDisplayName,
  getActorAvatarUrl,
} from '@/components/activity/rows/rowHelpers';
import { getNotificationActionText } from './getActionText';
import { INK, INK_SOFT, INK_SUBTLE, AMBER, REVEAL } from './tokens';

interface Props {
  notification: ActivityNotification;
  onClick: () => void;
}

/** Sport-pin badge — unified scorecard-flag motif over a gold tile. */
const PinBadge: React.FC = () => (
  <span
    className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] rounded-full ring-2 ring-white shadow-sm flex items-center justify-center"
    style={{ background: AMBER }}
    aria-hidden
  >
    <Flag size={10} strokeWidth={2.5} color="#FFFFFF" />
  </span>
);

export const NotificationLineRow: React.FC<Props> = ({ notification, onClick }) => {
  const actorName = getActorDisplayName(notification);
  const avatarUrl = getActorAvatarUrl(notification);
  const actionText = getNotificationActionText(notification);

  return (
    <motion.button
      {...REVEAL}
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 text-left active:bg-black/[0.02] transition-colors"
      style={{
        padding: '12px 14px',
        background: notification.is_unread ? 'rgba(247,147,30,0.035)' : 'transparent',
      }}
    >
      <div className="relative shrink-0">
        <div style={{ borderRadius: '34%', lineHeight: 0 }}>
          <SquircleAvatar
            src={avatarUrl}
            alt={actorName || 'User'}
            size={40}
            fallback={actorName?.charAt(0) || '?'}
            hideRing
          />
        </div>
        <PinBadge />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[1.35] break-words" style={{ color: INK }}>
          <span className="font-semibold">{actorName}</span>{' '}
          <span style={{ color: INK_SOFT }} className="font-normal">{actionText}</span>
        </p>
      </div>

      <span className="shrink-0 text-[11px] font-medium tabular-nums mt-px" style={{ color: INK_SUBTLE }}>
        {notification.time_ago}
      </span>
    </motion.button>
  );
};
