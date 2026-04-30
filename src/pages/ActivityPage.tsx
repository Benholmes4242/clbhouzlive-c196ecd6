import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useActivityFeed, ActivityNotification, checkContentExists } from '@/hooks/useActivityFeed';
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
import { useUnseenFriendReviews } from '@/hooks/useUnseenFriendReviews';

const FRIEND_TYPES = new Set([
  'friend_request', 'friend_accept', 'friend_accepted',
  'friend_request_sent', 'friend_declined', 'friend_cancelled',
  'follow',
]);

const REVIEW_TYPES = new Set([
  'course_review', 'friend_course_review', 'business_course_review', 'review_response',
]);

// Intentional divergence from original brief: excludes generic 'comment' / 'comment_reply'
// because those are not always mentions. Limited to types that explicitly represent a mention
// (verified against useActivityFeed.ts notification type union).
const MENTION_TYPES = new Set([
  'mention', 'tag', 'mention_post', 'comment_mention', 'top_ten_mention',
]);

const FILTER_CHIPS = ['All', 'Reviews', 'Friends', 'Mentions'] as const;
type ChipFilter = typeof FILTER_CHIPS[number];

const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const BORDER = 'rgba(15,23,42,0.07)';
const BG_SURFACE = '#F8FAFC';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97A10';
const FONT_SERIF = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="sticky top-0 z-10 flex items-center gap-2 px-5 py-2"
    style={{ background: BG_SURFACE }}
  >
    <div style={{ width: 3, height: 9, background: AMBER, borderRadius: 1, flexShrink: 0 }} />
    <span style={{ fontSize: 10, fontWeight: 800, color: INK_SUBTLE, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
      {label}
    </span>
  </div>
);

const ActivityPage: React.FC = () => {
  const [chipFilter, setChipFilter] = useState<ChipFilter>('All');

  const { isRehydrating } = useRehydrationSafe();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActivityNotification | null>(null);

  const { data, isLoading, isFetching, error } = useActivityFeed('all', null);

  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { markCoursesAsSeen } = useUnseenFriendReviews();
  const navigate = useNavigate();

  const hasMarkedSeen = useRef(false);
  const isInitialMountRef = useRef(true);
  const [sessionNewIds, setSessionNewIds] = useState<string[] | null>(null);
  const [sessionNewCount, setSessionNewCount] = useState<number | null>(null);
  const [hasInitializedNew, setHasInitializedNew] = useState(false);

  useEffect(() => {
    if (hasInitializedNew) return;
    if (!user?.id || isLoading) return;
    if (!data?.buckets?.new || data.buckets.new.length === 0) {
      if (data && !isLoading) setHasInitializedNew(true);
      return;
    }

    const ids = data.buckets.new.map((n) => n.id);
    setSessionNewIds(ids);
    setSessionNewCount(ids.length);
    setHasInitializedNew(true);

    const markSeen = async () => {
      const now = new Date().toISOString();
      queryClient.setQueryData(['user-profile', user.id], (old: any) => old ? { ...old, last_notifications_seen_at: now } : old);
      await supabase.from('user_profiles').update({ last_notifications_seen_at: now }).eq('id', user.id);
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).lte('created_at', now);
      hasMarkedSeen.current = true;
      markCoursesAsSeen();
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    };

    void markSeen();
  }, [user?.id, isLoading, data, queryClient, hasInitializedNew]);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    };
  }, [queryClient]);

  // Flip initial-mount flag after first non-empty render so filter-change
  // re-renders skip the entrance stagger animation.
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => { isInitialMountRef.current = false; }, 1000);
    return () => clearTimeout(t);
  }, [data]);

  if (isRehydrating) return <ActivityPageSkeleton />;

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    await queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleMarkRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };

  const handleMarkUnread = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: false }).eq('id', id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_deleted: true }).eq('id', id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };

  const handleToggleRead = (notification: ActivityNotification) => {
    if (notification.is_mock) return;
    if (notification.is_unread) handleMarkRead(notification.id);
    else handleMarkUnread(notification.id);
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
    if (n.is_unread && !n.is_mock) await handleMarkRead(n.id);
    if (n.context_url && n.entity_type && n.entity_id) {
      const exists = await checkContentExists(n.entity_type, n.entity_id);
      if (!exists) {
        toast("Content unavailable", { description: "This content may have been deleted or removed." });
        handleDelete(n.id);
        return;
      }
    }
    if (n.context_url) navigate(n.context_url);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).lte('created_at', now);
    await supabase.from('user_profiles').update({ last_notifications_seen_at: now }).eq('id', user.id);
    queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    setSessionNewCount(0);
    setSessionNewIds([]);
    toast.success('All notifications marked as read');
  };

  const buckets = data?.buckets;

  const applyFilter = (items: ActivityNotification[]) => {
    if (chipFilter === 'All') return items;
    if (chipFilter === 'Reviews') return items.filter(i => REVIEW_TYPES.has(i.type));
    if (chipFilter === 'Friends') return items.filter(i => FRIEND_TYPES.has(i.type));
    if (chipFilter === 'Mentions') return items.filter(i => MENTION_TYPES.has(i.type));
    return items;
  };

  const allItems = data?.allItems ?? [];
  const hasNotifications = allItems.length > 0;
  const showSkeleton = !data;
  const showEmptyState = !!data && !hasNotifications && !isFetching;
  const showMarkAllRead = (sessionNewCount ?? 0) > 0;

  return (
    <PageRoot>
      <div className="flex flex-col min-h-full" style={{ background: BG_SURFACE }}>
        <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">

          {/* Header */}
          <div className="px-5 pt-4 pb-0 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div style={{ width: 3, height: 10, background: AMBER, borderRadius: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: INK_SUBTLE, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Activity</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <h1
                  onClick={handleRefresh}
                  className={cn(
                    "leading-none cursor-pointer transition-opacity",
                    isRefreshing && "opacity-50"
                  )}
                  style={{
                    fontFamily: FONT_SERIF,
                    fontWeight: 900,
                    color: INK,
                    fontSize: 34,
                    letterSpacing: '-0.02em',
                  }}
                  aria-label="Notifications - tap to refresh"
                >
                  Notifications
                </h1>
                {sessionNewCount && sessionNewCount > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>
                    {sessionNewCount} new
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-5 pt-3 pb-2 overflow-x-auto scrollbar-none">
            {FILTER_CHIPS.map(chip => {
              const isActive = chipFilter === chip;
              const count = chip === 'All' ? allItems.length : null;
              return (
                <button
                  key={chip}
                  onClick={() => setChipFilter(chip)}
                  className="shrink-0 rounded-full transition-all active:scale-[0.95] inline-flex items-center"
                  style={{
                    minHeight: 32,
                    padding: '6px 14px',
                    background: isActive ? INK : 'transparent',
                    color: isActive ? '#FFFFFF' : INK_SOFT,
                    border: isActive ? '1px solid transparent' : `1px solid ${BORDER}`,
                    fontSize: 12.5,
                    fontWeight: 600,
                    gap: 6,
                  }}
                >
                  {chip}
                  {count != null && count > 0 && (
                    <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 700 }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mark all read */}
          {showMarkAllRead && (
            <div className="flex justify-end px-5 pt-1 pb-1">
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: AMBER_DEEP,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                Mark all as read
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 mt-1">
            {showSkeleton ? (
              <div className="px-4"><ActivitySkeleton /></div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">Couldn't load activity</p>
                <p className="text-sm text-muted-foreground mb-6">Check your connection and try again</p>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['activity-feed'] })}
                  className="px-6 py-2.5 text-sm font-bold rounded-full active:scale-[0.97] transition-transform"
                  style={{ background: AMBER, color: '#ffffff' }}
                >
                  Try again
                </button>
              </div>
            ) : showEmptyState ? (
              <>
                <RateCourseNudge />
                <SuggestedCreatorsShelf
                  userId={user?.id}
                  title="Golfers you might know"
                  showViewAll={true}
                  onViewAll={() => navigate('/golfers')}
                  containerStyle={{ marginTop: 8 }}
                />
                <div className="px-4 pt-2"><ActivityEmptyState tab="all" /></div>
              </>
            ) : (
              <div className="w-full">
                <RateCourseNudge />

                {(() => {
                  const today = applyFilter(buckets?.today ?? []);
                  const yesterday = applyFilter(buckets?.yesterday ?? []);
                  const thisWeek = applyFilter(buckets?.thisWeek ?? []);
                  const earlier = applyFilter(buckets?.earlier ?? []);

                  const sections = [
                    { label: 'Today', items: today },
                    { label: 'Yesterday', items: yesterday },
                    { label: 'This Week', items: thisWeek },
                    { label: 'Earlier', items: earlier },
                  ].filter(s => s.items.length > 0);

                  if (sections.length === 0) {
                    return (
                      <div className="px-4 pt-8 pb-12 text-center">
                        <p style={{ fontSize: 13, color: INK_SUBTLE }}>
                          No notifications match this filter.
                        </p>
                      </div>
                    );
                  }

                  let globalIndex = 0;
                  return sections.map(section => (
                    <section key={section.label}>
                      <SectionHeader label={section.label} />
                      <div className="px-4 space-y-2.5 pb-5 pt-2">
                        {section.items.map(item => {
                          const idx = globalIndex++;
                          return (
                            <FeaturedNotificationCard
                              key={item.id}
                              notification={item}
                              index={isInitialMountRef.current ? idx : 0}
                              skipAnimation={!isInitialMountRef.current}
                              onClick={() => handleNotificationClick(item)}
                              onOpenActionsSheet={() => openActionsSheet(item)}
                              currentUserId={user?.id}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ));
                })()}
              </div>
            )}
          </div>

        </div>
      </div>

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
