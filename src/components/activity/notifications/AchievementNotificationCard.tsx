import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import {
  INK, INK_SOFT,
  BORDER, SURFACE, UNREAD_BG, UNREAD_BORDER,
  REVEAL, CARD_RADIUS, GOLD_GRAD,
} from './tokens';

interface Props {
  notification: ActivityNotification;
  onClick: () => void;
}

export const AchievementNotificationCard: React.FC<Props> = ({ notification, onClick }) => {
  const title = notification.title || 'Achievement unlocked';
  const detail = notification.message || (notification.data?.achievement_name as string) || '';

  return (
    <motion.div
      {...REVEAL}
      onClick={onClick}
      className="cursor-pointer active:scale-[0.985] transition-transform"
      style={{
        background: notification.is_unread ? UNREAD_BG : SURFACE,
        border: `1px solid ${notification.is_unread ? UNREAD_BORDER : BORDER}`,
        borderRadius: CARD_RADIUS,
        padding: 14,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: GOLD_GRAD,
            boxShadow: '0 4px 14px rgba(182,112,14,0.30)',
          }}
        >
          <Trophy size={24} color="#FFFFFF" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14.5px] font-bold leading-[1.25] truncate" style={{ color: INK }}>
            {title}
          </h3>
          {detail && (
            <p className="text-[12.5px] mt-0.5 line-clamp-2" style={{ color: INK_SOFT }}>
              {detail}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[11px] font-medium tabular-nums self-start" style={{ color: '#94A3B8' }}>
          {notification.time_ago}
        </span>
      </div>
    </motion.div>
  );
};
