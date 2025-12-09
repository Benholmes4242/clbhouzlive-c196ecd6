import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS, ActivityNotification, ChipFilterKind } from '@/hooks/useActivityFeed';
import { ActivityBucket } from '@/components/activity/ActivityBucket';
import { AtAGlanceChips } from '@/components/activity/AtAGlanceChips';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { MarkAllReadSheet } from '@/components/activity/MarkAllReadSheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { PageRoot } from '@/components/layout/PageRoot';
import CompactHeader from '@/components/header/CompactHeader';

// Feature flag for Mark All Read
const ENABLE_MARK_ALL_READ = true;

const ActivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('all');
  const [activeChipFilter, setActiveChipFilter] = useState<ChipFilterKind>(null);
  const [showMarkAllSheet, setShowMarkAllSheet] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  
  // Pass chip filter to hook (only applies when on 'all' tab)
  const effectiveChipFilter = activeTab === 'all' ? activeChipFilter : null;
  const { data, isLoading, error } = useActivityFeed(activeTab, effectiveChipFilter);
  
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const buckets = data?.buckets;
  const counts = data?.counts;
  const unreadCount = counts?.new || 0;

  // Clear chip filter when switching away from All tab
  const handleTabChange = (tabId: ActivityTabId) => {
    setActiveTab(tabId);
    if (tabId !== 'all') {
      setActiveChipFilter(null);
    }
  };

  const handleMarkAllAsReadClick = () => {
    if (unreadCount === 0) {
      toast.info("You're all caught up – no unread activity.");
      return;
    }
    setShowMarkAllSheet(true);
  };

  const handleConfirmMarkAllRead = async () => {
    if (!user?.id) return;
    
    setMarkingAllRead(true);
    
    // Optimistic update - mark all as read in local state
    queryClient.setQueryData(['activity-feed', activeTab, effectiveChipFilter, user.id], (old: any) => {
      if (!old) return old;
      const updatedItems = old.allItems?.map((item: ActivityNotification) => ({
        ...item,
        is_unread: false,
        is_read: true,
      })) || [];
      return {
        ...old,
        allItems: updatedItems,
        buckets: {
          new: [],
          today: updatedItems.filter((i: ActivityNotification) => !i.is_unread),
          yesterday: old.buckets.yesterday,
          thisWeek: old.buckets.thisWeek,
          earlier: old.buckets.earlier,
        },
        counts: { ...old.counts, new: 0 },
      };
    });

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setMarkingAllRead(false);
    setShowMarkAllSheet(false);

    if (error) {
      toast.error("We couldn't mark everything as read. Please try again.");
      // Revert by refetching
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    toast.success('All caught up – activity cleared.');
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
    // Mark as read if unread
    if (notification.is_unread) {
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
      setActiveChipFilter(kind as ChipFilterKind);
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
    data?.allItems?.every(item => !item.is_unread);

  return (
    <PageRoot className="bg-muted/40 pb-24">
      <CompactHeader />

      {/* Main content wrapper - matches Courses/Profile gutters */}
      <div className="max-w-screen-sm mx-auto px-4 pt-6 compact-header-offset">
        {/* Header section with title and mark all read pill */}
        <section className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Activity
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Updates from friends, clubs, courses & messages.
              </p>
            </div>
          </div>
          
          {/* Mark all as read pill button - only show when there are unread items */}
          {ENABLE_MARK_ALL_READ && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsReadClick}
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                "rounded-sq-pill border border-border/60 bg-background/80",
                "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                "transition-colors duration-200"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </section>

        {/* Filter tabs - Apple-style segmented control */}
        <div className="mb-4 overflow-x-auto scrollbar-hide">
          <div className="inline-flex rounded-sq-pill bg-muted/70 border border-border/40 p-1 gap-0.5">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
                currentUserId={user?.id}
              />
            )}

            {/* Today */}
            {buckets.today.length > 0 && (
              <ActivityBucket
                label="Today"
                items={buckets.today.filter(i => !i.is_unread)} // Exclude unread (already in New)
                onNotificationClick={handleNotificationClick}
                onMarkRead={handleMarkRead}
                onHide={handleHide}
                currentUserId={user?.id}
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
                currentUserId={user?.id}
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
                currentUserId={user?.id}
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
                currentUserId={user?.id}
              />
            )}
          </div>
        )}
      </div>

      {/* Mark all as read confirmation sheet */}
      <MarkAllReadSheet
        open={showMarkAllSheet}
        onOpenChange={setShowMarkAllSheet}
        unreadCount={unreadCount}
        onConfirm={handleConfirmMarkAllRead}
        isLoading={markingAllRead}
      />
    </PageRoot>
  );
};

export default ActivityPage;
