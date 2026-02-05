import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from './ActivityNotificationRow';

// Helper for descriptive ARIA labels
function getNotificationAriaLabel(n: ActivityNotification): string {
  const unreadPrefix = n.is_unread ? 'Unread: ' : '';
  return `${unreadPrefix}${n.actor_display_name} ${n.type.replace(/_/g, ' ')} ${n.time_ago}`;
}

interface ActivityBucketProps {
  label: string;
  items: ActivityNotification[];
  sticky?: boolean;
  accent?: boolean;
  onNotificationClick: (notification: ActivityNotification) => void;
  onOpenActionsSheet: (notification: ActivityNotification) => void;
  currentUserId?: string;
  sessionNewIds?: string[] | null;
}

export const ActivityBucket: React.FC<ActivityBucketProps> = ({ 
  label, 
  items, 
  sticky,
  accent,
  onNotificationClick,
  onOpenActionsSheet,
  currentUserId,
  sessionNewIds
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full">
      {/* Section label - Hub standard */}
      <div
        className={cn(
          "max-w-[640px] mx-auto px-4 sm:px-5",
          "py-2 bg-background border-y border-border"
        )}
      >
        <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Notification rows - full bleed */}
      <div role="list" aria-label="Notifications" className="divide-y divide-border/30">
        <AnimatePresence initial={false}>
          {items.map(item => (
            <motion.div
              key={item.id}
              role="listitem"
              aria-label={getNotificationAriaLabel(item)}
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
                isSessionNew={sessionNewIds?.includes(item.id) ?? false}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};