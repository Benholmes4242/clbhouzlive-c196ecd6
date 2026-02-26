import React, { useState } from 'react';
import { Bell, Settings, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS, ActivityNotification } from '@/hooks/useActivityFeed';
import { ActivityBucket } from '@/components/activity/ActivityBucket';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { NotificationActionsSheet } from '@/components/activity/NotificationActionsSheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

interface ActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('all');
  const { data, isLoading, error } = useActivityFeed(activeTab);
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Bottom sheet state for notification actions
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActivityNotification | null>(null);

  const buckets = data?.buckets;
  const counts = data?.counts;

  const hasUnread = counts && counts.new > 0;

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      toast.error('Failed to mark all as read');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    toast.success('All marked as read');
  };

  const handleMarkRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };

  const handleMarkUnread = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('id', id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };

  const handleToggleRead = (notification: ActivityNotification) => {
    if (notification.is_mock) return;
    if (notification.is_unread) {
      handleMarkRead(notification.id);
    } else {
      handleMarkUnread(notification.id);
    }
  };

  const handleDeleteNotification = (notification: ActivityNotification) => {
    if (notification.is_mock) return;
    handleDelete(notification.id);
  };

  const openActionsSheet = (notification: ActivityNotification) => {
    setSelectedNotification(notification);
    setActionSheetOpen(true);
  };

  const handleNotificationClick = async (notification: ActivityNotification) => {
    onOpenChange(false);
    
    if (notification.context_url) {
      navigate(notification.context_url);
    }

    if (!notification.is_read) {
      await handleMarkRead(notification.id);
    }
  };

  const isEmpty = !buckets || (
    buckets.new.length === 0 &&
    buckets.today.length === 0 && 
    buckets.yesterday.length === 0 && 
    buckets.thisWeek.length === 0 && 
    buckets.earlier.length === 0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-full p-0 overflow-hidden"
        hideCloseButton
      >
        <div className="h-full overflow-y-auto bg-[#f5f5f7]">
          {/* Page header */}
          <header className="flex-shrink-0 px-5 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 border-b border-border/40 bg-background">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleMarkAllAsRead}
                  className="relative h-9 w-9 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60 hover:bg-accent transition-colors"
                  title="Mark all as read"
                >
                  <Bell className="h-4 w-4 text-foreground" />
                  {hasUnread && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>

                <button 
                  className="h-9 w-9 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60 hover:bg-accent transition-colors"
                  title="Notification settings"
                >
                  <Settings className="h-4 w-4 text-foreground" />
                </button>
              </div>
            </div>

            <div className="text-center mt-2">
              <h1 className="text-xl font-semibold text-foreground">Activity</h1>
              <p className="text-sm text-muted-foreground">
                Updates from friends, clubs, courses & messages.
              </p>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-24">
            {/* Filter tabs - Tier 2 */}
            <div className="mb-4">
              <div 
                className="grid w-full grid-cols-4 gap-1"
                role="tablist"
              >
                {ACTIVITY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative py-2 min-h-[44px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97]",
                      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:transition-all after:duration-200",
                      activeTab === tab.id
                        ? "text-foreground font-semibold after:bg-[hsl(var(--tab-orange))]"
                        : "text-muted-foreground font-medium hover:text-foreground after:bg-transparent"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <ActivitySkeleton />
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Failed to load activity</p>
              </div>
            ) : isEmpty || !buckets ? (
              <ActivityEmptyState tab={activeTab} />
            ) : (
              <div className="space-y-6">
                {buckets.new.length > 0 && (
                  <ActivityBucket
                    label="New"
                    items={buckets.new}
                    sticky
                    accent
                    onNotificationClick={handleNotificationClick}
                    onOpenActionsSheet={openActionsSheet}
                    currentUserId={user?.id}
                  />
                )}

                {buckets.today.length > 0 && (
                  <ActivityBucket
                    label="Today"
                    items={buckets.today.filter(i => i.is_read)}
                    onNotificationClick={handleNotificationClick}
                    onOpenActionsSheet={openActionsSheet}
                    currentUserId={user?.id}
                  />
                )}

                {buckets.yesterday.length > 0 && (
                  <ActivityBucket
                    label="Yesterday"
                    items={buckets.yesterday}
                    onNotificationClick={handleNotificationClick}
                    onOpenActionsSheet={openActionsSheet}
                    currentUserId={user?.id}
                  />
                )}

                {buckets.thisWeek.length > 0 && (
                  <ActivityBucket
                    label="This Week"
                    items={buckets.thisWeek}
                    onNotificationClick={handleNotificationClick}
                    onOpenActionsSheet={openActionsSheet}
                    currentUserId={user?.id}
                  />
                )}

                {buckets.earlier.length > 0 && (
                  <ActivityBucket
                    label="Earlier"
                    items={buckets.earlier}
                    onNotificationClick={handleNotificationClick}
                    onOpenActionsSheet={openActionsSheet}
                    currentUserId={user?.id}
                  />
                )}
              </div>
            )}
          </main>
        </div>

        {/* Bottom sheet for notification actions */}
        <NotificationActionsSheet
          open={actionSheetOpen}
          notification={selectedNotification}
          onClose={() => setActionSheetOpen(false)}
          onToggleRead={handleToggleRead}
          onDelete={handleDeleteNotification}
        />
      </SheetContent>
    </Sheet>
  );
};

export default ActivityModal;
