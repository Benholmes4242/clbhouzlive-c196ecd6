import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS, ActivityNotification, ChipFilterKind } from '@/hooks/useActivityFeed';
import { ActivityBucket } from '@/components/activity/ActivityBucket';
import { AtAGlanceChips } from '@/components/activity/AtAGlanceChips';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageRoot } from '@/components/layout/PageRoot';
import CompactHeader from '@/components/header/CompactHeader';

const ActivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('all');
  const [activeChipFilter, setActiveChipFilter] = useState<ChipFilterKind>(null);
  
  // Pass chip filter to hook (only applies when on 'all' tab)
  const effectiveChipFilter = activeTab === 'all' ? activeChipFilter : null;
  const { data, isLoading, error } = useActivityFeed(activeTab, effectiveChipFilter);
  
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const buckets = data?.buckets;
  const counts = data?.counts;

  // Clear chip filter when switching away from All tab
  const handleTabChange = (tabId: ActivityTabId) => {
    setActiveTab(tabId);
    if (tabId !== 'all') {
      setActiveChipFilter(null);
    }
  };

  // Mark a single notification as read
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

  // Mark a single notification as unread (swipe left action)
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

  // Delete/hide a notification (swipe right action) - soft delete
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

  // When user clicks a notification: mark as read + navigate
  const handleNotificationClick = async (notification: ActivityNotification) => {
    // Mark as read if unread
    if (notification.is_unread && !notification.is_mock) {
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

  // Check if there are no new/unread items (for showing "caught up" banner, NOT for hiding history)
  const isAllCaughtUp = !isEmpty && buckets && buckets.new.length === 0;

  return (
    <PageRoot className="bg-muted/40 pb-24">
      <CompactHeader />

        {/* Main content wrapper - centered with equal padding both sides */}
        <div className="w-full max-w-[640px] mx-auto px-4 sm:px-5 pt-6 compact-header-offset">
        {/* Header section - title only */}
        <section className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Updates from friends, golf clubs and messages.
          </p>
        </section>

        {/* Filter tabs - Apple-style segmented control matching Golf Courses width */}
        <div className="mb-4">
          <div className="grid w-full grid-cols-4 rounded-sq-md bg-muted/70 border border-border/60 px-2 py-[3px]">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "rounded-sq-pill text-sm px-3 py-[6px] font-medium transition-all duration-motion-fast ease-standard",
                  activeTab === tab.id
                    ? "bg-background shadow-sm text-foreground"
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
          <div className="text-left py-12 text-muted-foreground">
            <p>Failed to load activity</p>
          </div>
        ) : isEmpty ? (
          <ActivityEmptyState tab={activeTab} />
        ) : buckets && (
          <div className="w-full mt-4 space-y-6">
            {/* All caught up banner - shown when no new/unread items but history exists */}
            {isAllCaughtUp && (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="text-sm font-medium text-foreground">You're all caught up</span>
                <span className="text-xs text-muted-foreground mt-0.5">These are your recent updates</span>
              </div>
            )}

            {/* New (unread) - only show if there are unread items */}
            {buckets.new.length > 0 && (
              <ActivityBucket
                label="New"
                items={buckets.new}
                sticky
                accent
                onNotificationClick={handleNotificationClick}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
                currentUserId={user?.id}
              />
            )}

            {/* Today */}
            {buckets.today.length > 0 && (
              <ActivityBucket
                label="Today"
                items={buckets.today.filter(i => !i.is_unread)} // Exclude unread (already in New)
                onNotificationClick={handleNotificationClick}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
                currentUserId={user?.id}
              />
            )}

            {/* Yesterday */}
            {buckets.yesterday.length > 0 && (
              <ActivityBucket
                label="Yesterday"
                items={buckets.yesterday}
                onNotificationClick={handleNotificationClick}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
                currentUserId={user?.id}
              />
            )}

            {/* This Week */}
            {buckets.thisWeek.length > 0 && (
              <ActivityBucket
                label="This Week"
                items={buckets.thisWeek}
                onNotificationClick={handleNotificationClick}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
                currentUserId={user?.id}
              />
            )}

            {/* Earlier */}
            {buckets.earlier.length > 0 && (
              <ActivityBucket
                label="Earlier"
                items={buckets.earlier}
                onNotificationClick={handleNotificationClick}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
                currentUserId={user?.id}
              />
            )}
          </div>
        )}
      </div>
    </PageRoot>
  );
};

export default ActivityPage;
