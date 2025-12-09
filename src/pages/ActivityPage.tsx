import React, { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from '@/components/activity/ActivityNotificationRow';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { PageRoot } from '@/components/layout/PageRoot';
import CompactHeader from '@/components/header/CompactHeader';

const ActivityPage: React.FC = () => {
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
    if (notification.context_url) {
      navigate(notification.context_url);
    }

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
    <PageRoot className="bg-bg-page pb-24">
      <CompactHeader />
      {/* Main content wrapper */}
      <div className="max-w-[720px] mx-auto p-4 compact-header-offset">
        {/* Header section */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-foreground">
              Activity
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Updates from friends, clubs, courses & messages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleMarkAllAsRead}
              className="h-9 w-9 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60 hover:bg-accent transition-colors"
              title="Mark all as read"
            >
              <Bell className="h-4 w-4 text-foreground" />
            </button>
            <button 
              className="h-9 w-9 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60 hover:bg-accent transition-colors"
              title="Notification settings"
            >
              <Settings className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

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
      </div>
    </PageRoot>
  );
};

export default ActivityPage;
