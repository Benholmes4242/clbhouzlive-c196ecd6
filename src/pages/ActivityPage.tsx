import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS, ActivityNotification, ChipFilterKind, checkContentExists } from '@/hooks/useActivityFeed';
import { ActivityBucket } from '@/components/activity/ActivityBucket';
import { AtAGlanceChips } from '@/components/activity/AtAGlanceChips';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { NotificationActionsSheet } from '@/components/activity/NotificationActionsSheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageRoot } from '@/components/layout/PageRoot';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { useActiveActor } from '@/context/ActiveActorContext';
import { ActivityPageSkeleton } from '@/components/skeletons/ActivityPageSkeleton';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ActivityPage: React.FC = () => {
  // ============================================
  // ALL HOOKS FIRST - No conditional returns above this section
  // ============================================
  const [activeTab, setActiveTab] = useState<ActivityTabId>('all');
  const [activeChipFilter, setActiveChipFilter] = useState<ChipFilterKind>(null);
  
  // Rehydration state - show skeleton when app is rehydrating after background
  const { isRehydrating } = useRehydrationSafe();
  
  // Tap-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Bottom sheet state for notification actions
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActivityNotification | null>(null);
  
  // Pass chip filter to hook (only applies when on 'all' tab)
  const effectiveChipFilter = activeTab === 'all' ? activeChipFilter : null;
  const { data, isLoading, isFetching, isFetched, error } = useActivityFeed(activeTab, effectiveChipFilter);
  
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { activeActor } = useActiveActor();
  const { toast } = useToast();
  
  // Track if we've already marked notifications as seen this session
  const hasMarkedSeen = useRef(false);
  
  // Session-based "New" retention: capture IDs + count on first load, keep them in "New" until leaving
  const [sessionNewIds, setSessionNewIds] = useState<string[] | null>(null);
  const [sessionNewCount, setSessionNewCount] = useState<number | null>(null);
  const [hasInitializedNew, setHasInitializedNew] = useState(false);
  
  // On first load: capture "New" IDs, mark them read (clears bell), but keep showing in "New"
  useEffect(() => {
    if (hasInitializedNew) return;
    if (!user?.id || isLoading) return;
    if (!data?.buckets?.new || data.buckets.new.length === 0) {
      // No new items - still mark initialized to prevent re-running
      if (data && !isLoading) {
        setHasInitializedNew(true);
      }
      return;
    }
    
    // Capture the IDs and count of items currently in "New"
    const ids = data.buckets.new.map((n) => n.id);
    setSessionNewIds(ids);
    setSessionNewCount(ids.length);
    setHasInitializedNew(true);
    
    const markSeen = async () => {
      const now = new Date().toISOString();
      
      // 1) OPTIMISTICALLY update user profile cache with new timestamp FIRST
      // This ensures the unread count query key changes immediately
      queryClient.setQueryData(['user-profile', user.id], (old: any) => {
        if (!old) return old;
        return { ...old, last_notifications_seen_at: now };
      });
      
      // 2) Update last_notifications_seen_at in database
      await supabase
        .from('user_profiles')
        .update({ last_notifications_seen_at: now })
        .eq('id', user.id);
      
      // 3) Mark all existing notifications as read at that moment
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .lte('created_at', now);
      
      hasMarkedSeen.current = true;
      
      // 4) Invalidate unread count - now uses new timestamp from optimistic update
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    };
    
    void markSeen();
  }, [user?.id, isLoading, data, queryClient, hasInitializedNew]);
  
  // On unmount: invalidate activity-feed so next visit shows items in proper time buckets
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    };
  }, [queryClient]);

  // Derive "New" items: use sessionNewIds if captured, otherwise fall back to buckets.new
  // MUST be called before any early returns to comply with React hooks rules
  const sessionNewItems = React.useMemo(() => {
    if (!sessionNewIds || !data?.allItems) return null;
    const byId = new Map(data.allItems.map((n) => [n.id, n]));
    return sessionNewIds.map((id) => byId.get(id)).filter(Boolean) as ActivityNotification[];
  }, [sessionNewIds, data?.allItems]);

  // ============================================
  // EARLY RETURNS - Only AFTER all hooks
  // ============================================
  if (isRehydrating) {
    return <ActivityPageSkeleton />;
  }

  // Tap-to-refresh handler (Fix 5)
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    await queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

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

  // Mark a single notification as unread
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

  // Delete/hide a notification - soft delete
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

  // Toggle read state from bottom sheet
  const handleToggleRead = (notification: ActivityNotification) => {
    if (notification.is_mock) return;
    if (notification.is_unread) {
      handleMarkRead(notification.id);
    } else {
      handleMarkUnread(notification.id);
    }
  };

  // Delete from bottom sheet
  const handleDeleteNotification = (notification: ActivityNotification) => {
    if (notification.is_mock) return;
    handleDelete(notification.id);
  };

  // Open bottom sheet for a notification
  const openActionsSheet = (notification: ActivityNotification) => {
    setSelectedNotification(notification);
    setActionSheetOpen(true);
  };

  // When user clicks a notification: mark as read + navigate
  const handleNotificationClick = async (n: ActivityNotification) => {
    // Mark as read if unread
    if (n.is_unread && !n.is_mock) {
      await handleMarkRead(n.id);
    }

    // Check content exists before navigating (Fix 4)
    if (n.context_url && n.entity_type && n.entity_id) {
      const exists = await checkContentExists(n.entity_type, n.entity_id);
      if (!exists) {
        toast({
          title: "Content unavailable",
          description: "This content may have been deleted or removed.",
        });
        // Optionally remove from view
        handleDelete(n.id);
        return;
      }
    }

    // Safe to navigate
    if (n.context_url) {
      navigate(n.context_url);
    }
  };

  const handleChipClick = (kind: 'new' | 'mentions' | 'friends' | 'reviews' | 'messages') => {
    // Toggle filter: tap again to clear
    if (activeChipFilter === kind) {
      setActiveChipFilter(null);
    } else {
      setActiveChipFilter(kind as ChipFilterKind);
    }
  };

  // Use session-based new items if available, otherwise fall back to buckets
  const effectiveNewItems = sessionNewItems ?? buckets?.new ?? [];
  
  const allItems = data?.allItems ?? [];
  const hasNotifications = allItems.length > 0;
  
  // Show skeleton only if we have NO data at all (not even placeholder)
  // This prevents flash when query key changes (e.g., lastNotificationsSeen updates)
  // because keepPreviousData keeps `data` populated even while refetching with new key
  const showSkeleton = !data;
  
  // Only show empty state when we have definitive empty data (not just missing data)
  const showEmptyState = !!data && !hasNotifications && !isFetching;

  // Check if there are no new/unread items (for showing "caught up" banner, NOT for hiding history)
  const isAllCaughtUp = hasNotifications && effectiveNewItems.length === 0;

  return (
    <PageRoot className="pb-24 bg-background">
      {/* Max-width container for tablet (Fix 10) */}
      <div className="max-w-lg mx-auto w-full">
      {/* Header section with padding */}
      <div className="w-full px-4 sm:px-5 pt-6">
        <section className="mb-4">
          <div className="flex items-center gap-2">
            <h1 
              onClick={handleRefresh}
              className={cn(
                "text-[1.25rem] font-semibold tracking-tight text-foreground cursor-pointer transition-opacity",
                isRefreshing && "opacity-50"
              )}
              aria-label="Activity - tap to refresh"
            >
              Activity
            </h1>
            {activeActor?.type === 'business' && (
              <span className="text-[0.875rem] text-muted-foreground">
                for {activeActor.name}
              </span>
            )}
          </div>
          <p className="text-[0.875rem] text-muted-foreground mt-0.5">
            Updates from friends, golf clubs and messages.
          </p>
        </section>

        {/* Filter tabs - Match Profile page style */}
        <div className="mb-4">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide px-0 -mx-0"
            role="tablist"
            aria-label="Activity filters"
          >
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`activity-panel-${tab.id}`}
                id={`activity-tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 text-[0.875rem] font-medium rounded-full transition-all duration-150 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
            sessionNewCount={sessionNewCount}
          />
        )}
      </div>

      {/* Notifications list panel - full width, no padding */}
      <div 
        role="tabpanel"
        id={`activity-panel-${activeTab}`}
        aria-labelledby={`activity-tab-${activeTab}`}
        className="w-full"
      >
        {/* Show skeleton until query has fetched */}
        {showSkeleton ? (
          <div className="px-4 sm:px-5">
            <ActivitySkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-[1rem] font-semibold text-foreground mb-1">
              Couldn't load activity
            </p>
            <p className="text-[0.875rem] text-muted-foreground mb-6">
              Check your connection and try again
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['activity-feed'] })}
              className="px-6 py-2.5 bg-primary text-primary-foreground text-[0.875rem] font-medium rounded-full active:scale-95 transition-transform"
            >
              Try again
            </button>
          </div>
        ) : showEmptyState ? (
          <div className="px-4 sm:px-5">
            <ActivityEmptyState tab={activeTab} />
          </div>
        ) : buckets && (
          <div className="w-full mt-4 space-y-0">
            {/* All caught up banner */}
            {isAllCaughtUp && (
              <div className="flex flex-col items-center py-6 px-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-px w-8 bg-border" />
                  <span className="text-[0.75rem] font-medium">You're all caught up</span>
                  <div className="h-px w-8 bg-border" />
                </div>
                <p className="text-[0.75rem] text-muted-foreground/70 mt-1">
                  No further new notifications.
                </p>
              </div>
            )}

            {/* New (unread) */}
            {effectiveNewItems.length > 0 && (
              <ActivityBucket
                label="New"
                items={effectiveNewItems}
                sticky
                accent
                onNotificationClick={handleNotificationClick}
                onOpenActionsSheet={openActionsSheet}
                currentUserId={user?.id}
                sessionNewIds={sessionNewIds}
              />
            )}

            {/* Today */}
            {buckets.today.length > 0 && (
              <ActivityBucket
                label="Today"
                items={buckets.today.filter(i => 
                  !i.is_unread && (!sessionNewIds || !sessionNewIds.includes(i.id))
                )}
                onNotificationClick={handleNotificationClick}
                onOpenActionsSheet={openActionsSheet}
                currentUserId={user?.id}
              />
            )}

            {/* Yesterday */}
            {buckets.yesterday.length > 0 && (
              <ActivityBucket
                label="Yesterday"
                items={buckets.yesterday}
                onNotificationClick={handleNotificationClick}
                onOpenActionsSheet={openActionsSheet}
                currentUserId={user?.id}
              />
            )}

            {/* This Week */}
            {buckets.thisWeek.length > 0 && (
              <ActivityBucket
                label="This Week"
                items={buckets.thisWeek}
                onNotificationClick={handleNotificationClick}
                onOpenActionsSheet={openActionsSheet}
                currentUserId={user?.id}
              />
            )}

            {/* Earlier */}
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
      </div>

      {/* Bottom sheet for notification actions */}
      <NotificationActionsSheet
        open={actionSheetOpen}
        notification={selectedNotification}
        onClose={() => setActionSheetOpen(false)}
        onToggleRead={handleToggleRead}
        onDelete={handleDeleteNotification}
      />
      </div>
    </PageRoot>
  );
};

export default ActivityPage;
