import React from 'react';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SwipeableNotificationRow } from './SwipeableNotificationRow';

interface ActivityBucketProps {
  label: string;
  items: ActivityNotification[];
  sticky?: boolean;
  accent?: boolean;
  onNotificationClick: (notification: ActivityNotification) => void;
  onMarkUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

export const ActivityBucket: React.FC<ActivityBucketProps> = ({ 
  label, 
  items, 
  sticky,
  accent,
  onNotificationClick,
  onMarkUnread,
  onDelete,
  currentUserId
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full">
      {/* Section label */}
      <div
        className={cn(
          "mb-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          "text-muted-foreground"
        )}
      >
        {label}
      </div>

      <div className="space-y-1.5">
        {items.map(item => (
          <SwipeableNotificationRow
            key={item.id}
            notification={item}
            onClick={() => onNotificationClick(item)}
            onMarkUnread={onMarkUnread || (() => {})}
            onDelete={onDelete || (() => {})}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </section>
  );
};
