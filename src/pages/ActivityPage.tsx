import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS, ActivityNotification } from '@/hooks/useActivityFeed';
import { ActivityBucket } from '@/components/activity/ActivityBucket';
import { AtAGlanceChips } from '@/components/activity/AtAGlanceChips';
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
  const [activeChipFilter, setActiveChipFilter] = useState<string | null>(null);
  const { data, isLoading, error } = useActivityFeed(activeTab);
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const buckets = data?.buckets;
  const counts = data?.counts;

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

  const handleHide = async (id: string) => {
    // For now, just mark as read. Could delete in future.
    await handleMarkRead(id);
  };

  const handleNotificationClick = async (notification: ActivityNotification) => {
    // Mark as read
    if (!notification.is_read) {
      await handleMarkRead(notification.id);
    }

    // Navigate
    if (notification.context_url) {
      navigate(notification.context_url);
    }
  };

  const handleChipClick = (kind: 'new' | 'mentions' | 'follows' | 'clubs' | 'messages') => {
    // Toggle filter: tap again to clear
    if (activeChipFilter === kind) {
      setActiveChipFilter(null);
    } else {
      setActiveChipFilter(kind);
    }
  };

  const isEmpty = !buckets || (
    buckets.new.length === 0 &&
    buckets.today.length === 0 && 
    buckets.yesterday.length === 0 && 
    buckets.thisWeek.length === 0 && 
    buckets.earlier.length === 0
  );

  // Check if all items are read (caught up state)
  const isAllCaughtUp = !isEmpty && buckets && 
    buckets.new.length === 0 && 
    data?.allItems?.every(item => item.is_read);

  return (
    <PageRoot className="bg-muted/40 pb-24">
      <CompactHeader />

      {/* Main content wrapper - matches Courses/Profile gutters */}
      <div className="max-w-screen-sm mx-auto px-4 pt-6 compact-header-offset">
        {/* Header section - clean title only */}
        <section className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Updates from friends, clubs, courses & messages.
          </p>
        </section>

        {/* Filter tabs - Apple-style segmented control */}
        <div className="mb-4 overflow-x-auto scrollbar-hide">
          <div className="inline-flex rounded-sq-pill bg-muted/70 border border-border/40 p-1 gap-0.5">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-sq-pill whitespace-nowrap transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* At-a-glance chips (All tab only) */}
        {activeTab === 'all' && counts && (
          <AtAGlanceChips 
            counts={counts} 
            onChipClick={handleChipClick}
            activeFilter={activeChipFilter}
          />
        )}

        {/* Content */}
        {isLoading ? (
          <ActivitySkeleton />
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Failed to load activity</p>
          </div>
        ) : isEmpty ? (
          <ActivityEmptyState tab={activeTab} />
        ) : isAllCaughtUp ? (
          <ActivityEmptyState tab={activeTab} isAllCaughtUp />
        ) : buckets && (
          <div className="mt-4 space-y-6">
            {/* New (unread) - only show if there are unread items */}
            {buckets.new.length > 0 && (
              <ActivityBucket
                label="New"
                items={buckets.new}
                sticky
                accent
                onNotificationClick={handleNotificationClick}
                onMarkRead={handleMarkRead}
                onHide={handleHide}
              />
            )}

            {/* Today */}
            {buckets.today.length > 0 && (
              <ActivityBucket
                label="Today"
                items={buckets.today.filter(i => i.is_read)} // Exclude unread (already in New)
                onNotificationClick={handleNotificationClick}
                onMarkRead={handleMarkRead}
                onHide={handleHide}
              />
            )}

            {/* Yesterday */}
            {buckets.yesterday.length > 0 && (
              <ActivityBucket
                label="Yesterday"
                items={buckets.yesterday}
                onNotificationClick={handleNotificationClick}
                onMarkRead={handleMarkRead}
                onHide={handleHide}
              />
            )}

            {/* This Week */}
            {buckets.thisWeek.length > 0 && (
              <ActivityBucket
                label="This Week"
                items={buckets.thisWeek}
                onNotificationClick={handleNotificationClick}
                onMarkRead={handleMarkRead}
                onHide={handleHide}
              />
            )}

            {/* Earlier */}
            {buckets.earlier.length > 0 && (
              <ActivityBucket
                label="Earlier"
                items={buckets.earlier}
                onNotificationClick={handleNotificationClick}
                onMarkRead={handleMarkRead}
                onHide={handleHide}
              />
            )}
          </div>
        )}
      </div>
    </PageRoot>
  );
};

export default ActivityPage;
