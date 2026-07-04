import React from 'react';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import { InboxRow } from './InboxRow';

interface Props {
  items: ActivityNotification[];
  onClick: (n: ActivityNotification) => void;
  onOpenActionsSheet: (n: ActivityNotification) => void;
  currentUserId?: string;
}

/**
 * Option A "Inbox rows" — edge-to-edge unified rows for every notification.
 * Hairline separator between consecutive rows, no cards, no groups.
 */
export const NotificationList: React.FC<Props> = ({ items, onClick, currentUserId }) => {
  return (
    <div className="w-full">
      {items.map((n, i) => (
        <div
          key={n.id}
          style={
            i > 0
              ? { borderTop: '1px solid rgba(15,23,42,0.06)' }
              : undefined
          }
        >
          <InboxRow notification={n} onClick={() => onClick(n)} currentUserId={currentUserId} />
        </div>
      ))}
    </div>
  );
};
