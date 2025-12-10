import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from './ActivityNotificationRow';

interface ActivityBucketProps {
  label: string;
  items: ActivityNotification[];
  sticky?: boolean;
  accent?: boolean;
  onNotificationClick: (notification: ActivityNotification) => void;
  onOpenActionsSheet: (notification: ActivityNotification) => void;
  currentUserId?: string;
}

export const ActivityBucket: React.FC<ActivityBucketProps> = ({ 
  label, 
  items, 
  sticky,
  accent,
  onNotificationClick,
  onOpenActionsSheet,
  currentUserId
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full">
      {/* Section label - with side padding */}
      <div
        className={cn(
          "mb-2 py-1.5 px-4 sm:px-5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          "text-muted-foreground"
        )}
      >
        {label}
      </div>

      <div className="divide-y divide-border/30">
        <AnimatePresence initial={false}>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ActivityNotificationRow
                notification={item}
                onClick={() => onNotificationClick(item)}
                onOpenActionsSheet={() => onOpenActionsSheet(item)}
                currentUserId={currentUserId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};
