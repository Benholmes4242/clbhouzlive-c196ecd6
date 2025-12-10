import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <AnimatePresence initial={false}>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.22 }}
            >
              <SwipeableNotificationRow
                notification={item}
                onClick={() => onNotificationClick(item)}
                onMarkUnread={onMarkUnread || (() => {})}
                onDelete={onDelete || (() => {})}
                currentUserId={currentUserId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};