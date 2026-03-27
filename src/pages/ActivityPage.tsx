import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useActivityFeed, ActivityNotification, ChipFilterKind, checkContentExists } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from '@/components/activity/ActivityNotificationRow';
import { FeaturedNotificationCard } from '@/components/activity/FeaturedNotificationCard';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { NotificationActionsSheet } from '@/components/activity/NotificationActionsSheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { SuggestedCreatorsShelf } from '@/components/shared/SuggestedCreatorsShelf';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageRoot } from '@/components/layout/PageRoot';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { ActivityPageSkeleton } from '@/components/skeletons/ActivityPageSkeleton';
import { AlertCircle } from 'lucide-react';
import { RateCourseNudge } from '@/components/activity/RateCourseNudge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const FRIEND_TYPES = new Set([
  'friend_request', 'friend_accept', 'friend_accepted',
  'friend_request_sent', 'friend_declined', 'friend_cancelled',
]);

const SOCIAL_TYPES = new Set([
  'like', 'comment', 'comment_reply', 'mention', 'tag', 'follow', 'new_post', 'top_ten_comment', 'top_ten_reply', 'top_ten_mention',
]);

const FILTER_CHIPS = ['All', 'Social', 'Friends'] as const;
type ChipFilter = typeof FILTER_CHIPS[number];

const ActivityPage: React.FC = () => {
  // ============================================
  // ALL HOOKS FIRST
  // ============================================
  const [chipFilter, setChipFilter] = useState<ChipFilter>('All');

  const { isRehydrating } = useRehydrationSafe();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActivityNotification | null>(null);

  // Always fetch 'all' tab with no chip filter — we filter client-side
  const { data, isLoading, isFetching, isFetched, error } = useActivityFeed('all', null);

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

  const sessionNewItems = useMemo(() => {
    if (!sessionNewIds || !data?.allItems) return null;
    const byId = new Map(data.allItems.map((n) => [n.id, n]));
    return sessionNewIds.map((id) => byId.get(id)).filter(Boolean) as ActivityNotification[];
  }, [sessionNewIds, data?.allItems]);

  // ============================================
  // EARLY RETURNS
  // ============================================
  if (isRehydrating) {
    return <ActivityPageSkeleton />;
  }

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    await queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    setTimeout(() => setIsRefreshing(false), 500);
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

  // ============================================
  // DERIVED DATA
  // ============================================
  const buckets = data?.buckets;
  const effectiveNewItems = sessionNewItems ?? buckets?.new ?? [];

  // Combine all "earlier" items (everything except new)
  const earlierItems = [
    ...(buckets?.today?.filter(i => !i.is_unread && (!sessionNewIds || !sessionNewIds.includes(i.id))) ?? []),
    ...(buckets?.yesterday ?? []),
    ...(buckets?.thisWeek ?? []),
    ...(buckets?.earlier ?? []),
  ];

  // Apply chip filter
  const applyFilter = (items: ActivityNotification[]) => {
    if (chipFilter === 'All') return items;
    if (chipFilter === 'Social') return items.filter(i => SOCIAL_TYPES.has(i.type));
    if (chipFilter === 'Friends') return items.filter(i => FRIEND_TYPES.has(i.type));
    return items;
  };

  const filteredNewItems = applyFilter(effectiveNewItems);
  const filteredEarlierItems = applyFilter(earlierItems);

  const allItems = data?.allItems ?? [];
  const hasNotifications = allItems.length > 0;
  const showSkeleton = !data;
  const showEmptyState = !!data && !hasNotifications && !isFetching;

  return (
    <PageRoot>
      <div className="flex flex-col min-h-full bg-[#F8FAFC]">
        <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">

          {/* Header */}
          <div className="px-5 pt-4 pb-0 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">
                Today
              </p>
              <h1
                onClick={handleRefresh}
                className={cn(
                  "font-display text-[28px] font-semibold leading-tight text-foreground cursor-pointer transition-opacity",
                  isRefreshing && "opacity-50"
                )}
                aria-label="Notifications - tap to refresh"
              >
                Notifications
              </h1>
            </div>
            {sessionNewCount && sessionNewCount > 0 ? (
              <span className="mb-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[hsl(38,92%,50%)] text-white">
                {sessionNewCount} new
              </span>
            ) : null}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-5 pt-3 pb-2 overflow-x-auto scrollbar-none">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setChipFilter(chip)}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all active:scale-[0.95]",
                  chipFilter === chip
                    ? "bg-foreground text-background"
                    : "bg-foreground/[0.07] text-muted-foreground"
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 mt-2">
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
                  className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-full active:scale-[0.97] transition-transform"
                >
                  Try again
                </button>
              </div>
            ) : showEmptyState ? (
              <>
                <SuggestedCreatorsShelf
                  userId={user?.id}
                  title="Golfers you might know"
                  showViewAll={true}
                  onViewAll={() => navigate('/golfers')}
                  containerStyle={{ marginTop: 8 }}
                />
                <div className="px-4 pt-2">
                  <ActivityEmptyState tab="all" />
                </div>
              </>
            ) : (
              <div className="w-full space-y-0">
                {/* Tier 1 — Featured cards for new/unread */}
                {filteredNewItems.length > 0 && (
                  <div className="px-4 space-y-3 pb-4">
                    {filteredNewItems.map((item, i) => (
                      <FeaturedNotificationCard
                        key={item.id}
                        notification={item}
                        index={i}
                        onClick={() => handleNotificationClick(item)}
                        onOpenActionsSheet={() => openActionsSheet(item)}
                        currentUserId={user?.id}
                      />
                    ))}
                  </div>
                )}

                {/* Suggested creators after new notifications */}
                {filteredNewItems.length > 0 && (
                  <SuggestedCreatorsShelf
                    userId={user?.id}
                    title="You might also know"
                    showViewAll={false}
                    containerStyle={{ marginTop: 4, marginBottom: 4 }}
                  />
                )}

                {/* Tier 2 — Compact list for earlier */}
                {filteredEarlierItems.length > 0 && (
                  <div>
                    {/* Divider label */}
                    <div className="px-5 pt-2 pb-2">
                      <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground/60">
                        Earlier
                      </span>
                    </div>

                    {/* White card container */}
                    <div className="mx-3 rounded-2xl bg-background border border-border/50 overflow-hidden divide-y divide-border/40">
                      {filteredEarlierItems.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.25 + i * 0.04 }}
                        >
                          <ActivityNotificationRow
                            notification={item}
                            onClick={() => handleNotificationClick(item)}
                            onOpenActionsSheet={() => openActionsSheet(item)}
                            currentUserId={user?.id}
                            isSessionNew={false}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
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
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default ActivityPage;
