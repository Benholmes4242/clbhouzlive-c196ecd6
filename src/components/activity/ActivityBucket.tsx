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
}

export const ActivityBucket: React.FC<ActivityBucketProps> = ({ 
  label, 
  items, 
  sticky,
  accent,
  onNotificationClick,
  onMarkRead,
  onHide
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section>
      <div
        className={cn(
          "mb-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          sticky && "sticky top-[100px] z-10 bg-muted/90 backdrop-blur-sm -mx-4 px-4",
          accent ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
        {accent && items.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
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
          />
        ))}
      </div>
    </section>
  );
};
