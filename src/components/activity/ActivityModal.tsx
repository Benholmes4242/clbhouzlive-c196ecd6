import React, { useState } from 'react';
import { Bell, Settings, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from '@/components/activity/ActivityNotificationRow';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
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
  const { data: buckets, isLoading, error } = useActivityFeed(activeTab);
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const hasUnread = buckets && (
    buckets.today.some(n => !n.is_read) ||
    buckets.yesterday.some(n => !n.is_read) ||
    buckets.thisWeek.some(n => !n.is_read) ||
    buckets.earlier.some(n => !n.is_read)
  );

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
    toast.success('All marked as read');
  };

  const handleNotificationClick = async (notification: any) => {
    // Close modal first
    onOpenChange(false);
    
    // Navigate
    if (notification.context_url) {
      navigate(notification.context_url);
    }

    // Mark as read if unread
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    }
  };

  const isEmpty = !buckets || (
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
        <div className="h-full overflow-y-auto bg-muted/50">
          {/* Page header - matches achievements modal styling */}
          <header className="flex-shrink-0 px-5 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 border-b border-border/40 bg-background">
            <div className="flex items-center justify-between">
              {/* Back link - matches MilestonesAndAchievementsModal styling */}
              <button 
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {/* Mark all as read */}
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

                {/* Settings */}
                <button 
                  className="h-9 w-9 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60 hover:bg-accent transition-colors"
                  title="Notification settings"
                >
                  <Settings className="h-4 w-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Title block - centered */}
            <div className="text-center mt-2">
              <h1 className="text-xl font-semibold text-foreground">Activity</h1>
              <p className="text-sm text-muted-foreground">
                Updates from friends, clubs, courses & messages.
              </p>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-24">
            {/* Filter tabs */}
            <div className="mb-4 overflow-x-auto scrollbar-hide">
              <div className="inline-flex rounded-sq-pill bg-white/70 border border-border/60 px-1 py-1 gap-1">
                {ACTIVITY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-sq-pill whitespace-nowrap transition-all",
                      activeTab === tab.id
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:bg-white/60"
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
                {/* Today */}
                {buckets.today.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Today
                    </h2>
                    <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                      {buckets.today.map((notification) => (
                        <ActivityNotificationRow
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Yesterday */}
                {buckets.yesterday.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Yesterday
                    </h2>
                    <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                      {buckets.yesterday.map((notification) => (
                        <ActivityNotificationRow
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* This Week */}
                {buckets.thisWeek.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      This Week
                    </h2>
                    <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                      {buckets.thisWeek.map((notification) => (
                        <ActivityNotificationRow
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Earlier */}
                {buckets.earlier.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Earlier
                    </h2>
                    <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                      {buckets.earlier.map((notification) => (
                        <ActivityNotificationRow
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ActivityModal;
