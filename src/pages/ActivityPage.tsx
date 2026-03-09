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
import { toast } from 'sonner';

const ActivityPage: React.FC = () => {
  // ============================================
  // ALL HOOKS FIRST - No conditional returns above this section
  // ============================================
  const [activeTab, setActiveTab] = useState<ActivityTabId>('all');
  const [activeChipFilter, setActiveChipFilter] = useState<ChipFilterKind>(null);
  
  const { isRehydrating } = useRehydrationSafe();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActivityNotification | null>(null);
  
  const effectiveChipFilter = activeTab === 'all' ? activeChipFilter : null;
  const { data, isLoading, isFetching, isFetched, error } = useActivityFeed(activeTab, effectiveChipFilter);
  
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  
  const hasMarkedSeen = useRef(false);
  const [sessionNewIds, setSessionNewIds] = useState<string[] | null>(null);
  const [sessionNewCount, setSessionNewCount] = useState<number | null>(null);
  const [hasInitializedNew, setHasInitializedNew] = useState(false);
  
  // On first load: capture "New" IDs, mark them read, but keep showing in "New"
  useEffect(() => {
    if (hasInitializedNew) return;
    if (!user?.id || isLoading) return;
    if (!data?.buckets?.new || data.buckets.new.length === 0) {
      if (data && !isLoading) {
        setHasInitializedNew(true);
      }
      return;
    }
    
    const ids = data.buckets.new.map((n) => n.id);
    setSessionNewIds(ids);
    setSessionNewCount(ids.length);
    setHasInitializedNew(true);
    
    const markSeen = async () => {
      const now = new Date().toISOString();
      
      queryClient.setQueryData(['user-profile', user.id], (old: any) => {
        if (!old) return old;
        return { ...old, last_notifications_seen_at: now };
      });
      
      await supabase
        .from('user_profiles')
        .update({ last_notifications_seen_at: now })
        .eq('id', user.id);
      
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .lte('created_at', now);
      
      hasMarkedSeen.current = true;
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    };
    
    void markSeen();
  }, [user?.id, isLoading, data, queryClient, hasInitializedNew]);
  
  // On unmount: invalidate so next visit shows items in proper time buckets
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    };
  }, [queryClient]);

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

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    await queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const buckets = data?.buckets;
  const counts = data?.counts;

  const handleTabChange = (tabId: ActivityTabId) => {
    setActiveTab(tabId);
    if (tabId !== 'all') {
      setActiveChipFilter(null);
    }
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

  const handleNotificationClick = async (n: ActivityNotification) => {
    if (n.is_unread && !n.is_mock) {
      await handleMarkRead(n.id);
    }
    if (n.context_url && n.entity_type && n.entity_id) {
      const exists = await checkContentExists(n.entity_type, n.entity_id);
      if (!exists) {
        toast("Content unavailable", { description: "This content may have been deleted or removed." });
        handleDelete(n.id);
        return;
      }
    }
    if (n.context_url) {
      navigate(n.context_url);
    }
  };

  const handleChipClick = (kind: 'new' | 'mentions' | 'friends' | 'reviews' | 'messages') => {
    if (activeChipFilter === kind) {
      setActiveChipFilter(null);
    } else {
      setActiveChipFilter(kind as ChipFilterKind);
    }
  };

  const effectiveNewItems = sessionNewItems ?? buckets?.new ?? [];
  const allItems = data?.allItems ?? [];
  const hasNotifications = allItems.length > 0;
  const showSkeleton = !data;
  const showEmptyState = !!data && !hasNotifications && !isFetching;

  return (
    <PageRoot>
      <div className="flex flex-col min-h-full bg-[#F8FAFC] pt-[var(--sat)]">
        <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">

          {/* Header */}
          <div className="px-4 pt-4 pb-2 text-center">
            <p className="text-sm text-muted-foreground mb-0.5">
              Updates from your golf network
            </p>
            <h1
              onClick={handleRefresh}
              className={cn(
                "font-display text-[28px] font-semibold leading-tight text-foreground cursor-pointer transition-opacity",
                isRefreshing && "opacity-50"
              )}
              aria-label="Activity - tap to refresh"
            >
              Activity
            </h1>
          </div>

          {/* Tabs — Tier 1 dark fill pills */}
          <div className="flex gap-2 px-4 pb-1">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`activity-panel-${tab.id}`}
                id={`activity-tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-4 py-2 min-h-[44px] flex items-center text-sm font-medium rounded-full transition-all duration-150 whitespace-nowrap active:scale-[0.95]",
                  activeTab === tab.id
                    ? "bg-foreground text-background"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chips (All tab only) */}
          {activeTab === 'all' && counts && (
            <div className="px-4 pb-3">
              <AtAGlanceChips
                counts={counts}
                onChipClick={handleChipClick}
                activeFilter={activeChipFilter}
                sessionNewCount={sessionNewCount}
              />
            </div>
          )}

          {/* Content */}
          <div
            role="tabpanel"
            id={`activity-panel-${activeTab}`}
            aria-labelledby={`activity-tab-${activeTab}`}
            className="flex-1"
          >
            {showSkeleton ? (
              <div className="px-4">
                <ActivitySkeleton />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  Couldn't load activity
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Check your connection and try again
                </p>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['activity-feed'] })}
                  className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-full active:scale-95 transition-transform"
                >
                  Try again
                </button>
              </div>
            ) : showEmptyState ? (
              <div className="px-4">
                <ActivityEmptyState tab={activeTab} />
              </div>
            ) : buckets && (
              <div className="w-full mt-4 space-y-0">
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

        </div>
      </div>

      {/* Bottom sheet for notification actions */}
      <NotificationActionsSheet
        open={actionSheetOpen}
        notification={selectedNotification}
        onClose={() => setActionSheetOpen(false)}
        onToggleRead={handleToggleRead}
        onDelete={handleDeleteNotification}
      />
    </PageRoot>
  );
};

export default ActivityPage;
