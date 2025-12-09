import React from 'react';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from './ActivityNotificationRow';

interface ActivityBucketProps {
  label: string;
  items: ActivityNotification[];
  sticky?: boolean;
  accent?: boolean;
  onNotificationClick: (notification: ActivityNotification) => void;
  onMarkRead?: (id: string) => void;
  onHide?: (id: string) => void;
  currentUserId?: string;
}

export const ActivityBucket: React.FC<ActivityBucketProps> = ({ 
  label, 
  items, 
  sticky,
  accent,
  onNotificationClick,
  onMarkRead,
  onHide,
  currentUserId
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section>
      {/* Section label - non-sticky, scrolls with content */}
      <div
        className={cn(
          "mb-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          accent ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
        {accent && items.length > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 text-[11px] font-medium text-white px-1.5">
            {items.length}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {items.map(item => (
          <ActivityNotificationRow 
            key={item.id} 
            notification={item}
            onClick={() => onNotificationClick(item)}
            onMarkRead={onMarkRead}
            onHide={onHide}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </section>
  );
};
