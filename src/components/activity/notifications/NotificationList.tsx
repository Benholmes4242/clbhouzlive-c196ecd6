import React from 'react';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import { FeaturedNotificationCard } from '@/components/activity/FeaturedNotificationCard';
import { NotificationLineRow } from './NotificationLineRow';
import { NotificationLineGroup } from './NotificationLineGroup';
import { ReviewNotificationCard } from './ReviewNotificationCard';
import { RequestNotificationCard } from './RequestNotificationCard';
import { AchievementNotificationCard } from './AchievementNotificationCard';
import { StatusRow } from './StatusRow';
import { getNotificationTier } from './tiers';

interface ItemHandlers {
  onClick: (n: ActivityNotification) => void;
  onOpenActionsSheet: (n: ActivityNotification) => void;
  currentUserId?: string;
}

/**
 * Render a list of notifications using the two-tier system.
 * Consecutive line-tier items collapse into a single NotificationLineGroup so
 * the hairline-separator visual is preserved. Everything else renders as its
 * own block in order.
 */
export const NotificationList: React.FC<ItemHandlers & { items: ActivityNotification[] }> = ({
  items, onClick, onOpenActionsSheet, currentUserId,
}) => {
  const blocks: React.ReactNode[] = [];
  let lineBuffer: ActivityNotification[] = [];
  let key = 0;

  const flushLines = () => {
    if (lineBuffer.length === 0) return;
    const buf = lineBuffer;
    blocks.push(
      <NotificationLineGroup key={`lines-${key++}`}>
        {buf.map((n) => (
          <NotificationLineRow key={n.id} notification={n} onClick={() => onClick(n)} />
        ))}
      </NotificationLineGroup>,
    );
    lineBuffer = [];
  };

  for (const n of items) {
    const tier = getNotificationTier(n);
    if (tier === 'line') {
      lineBuffer.push(n);
      continue;
    }
    flushLines();
    switch (tier) {
      case 'review':
        blocks.push(<ReviewNotificationCard key={n.id} notification={n} onClick={() => onClick(n)} />);
        break;
      case 'request':
        blocks.push(<RequestNotificationCard key={n.id} notification={n} onClick={() => onClick(n)} />);
        break;
      case 'trophy':
        blocks.push(<AchievementNotificationCard key={n.id} notification={n} onClick={() => onClick(n)} />);
        break;
      case 'status':
        blocks.push(<StatusRow key={n.id} notification={n} onClick={() => onClick(n)} />);
        break;
      case 'legacy':
      default:
        // Game / trip / anything unhandled keeps the legacy renderer for now.
        blocks.push(
          <FeaturedNotificationCard
            key={n.id}
            notification={n}
            onClick={() => onClick(n)}
            onOpenActionsSheet={() => onOpenActionsSheet(n)}
            currentUserId={currentUserId}
          />,
        );
    }
  }
  flushLines();

  return <div className="space-y-2.5">{blocks}</div>;
};
