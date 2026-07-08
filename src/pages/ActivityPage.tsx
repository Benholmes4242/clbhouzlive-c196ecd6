import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, AlertCircle } from 'lucide-react';
import { useActivityFeed, ActivityNotification, checkContentExists } from '@/hooks/useActivityFeed';
import { NotificationList } from '@/components/activity/notifications/NotificationList';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { NotificationActionsSheet } from '@/components/activity/NotificationActionsSheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { ActivityPageSkeleton } from '@/components/skeletons/ActivityPageSkeleton';
import { toast } from 'sonner';
import { useUnseenFriendReviews } from '@/hooks/useUnseenFriendReviews';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { ManagePageShell } from '@/components/manage/ManagePageShell';

// ============ Tokens ============
const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_45 = '#64748B';
const INK_60 = '#475569';
const HAIR = 'rgba(15,23,42,0.08)';
const HAIR2 = 'rgba(15,23,42,0.10)';
const PAGE = '#F8FAFC';
const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#C97A10';

// Filter groupings
const FRIEND_TYPES = new Set([
  'friend_request', 'friend_accept', 'friend_accepted',
  'friend_request_sent', 'friend_declined', 'friend_cancelled',
  'follow',
]);
const REVIEW_TYPES = new Set([
  'course_review', 'friend_course_review', 'course_review_received', 'review_response_posted',
]);
const MENTION_TYPES = new Set([
  'mention', 'tag', 'mention_post', 'comment_mention', 'top_ten_mention',
]);

type ChipKey = 'all' | 'reviews' | 'friends' | 'mentions';
const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'friends', label: 'Friends' },
  { key: 'mentions', label: 'Mentions' },
];

function matchesChip(n: ActivityNotification, chip: ChipKey): boolean {
  if (chip === 'all') return true;
  if (chip === 'reviews') return REVIEW_TYPES.has(n.type);
  if (chip === 'friends') return FRIEND_TYPES.has(n.type);
  if (chip === 'mentions') return MENTION_TYPES.has(n.type);
  return true;
}

// ============ Sub components ============
const DayHeader: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ padding: '20px 16px 10px' }}>
    <div
      style={{
        fontSize: 10.5, fontWeight: 800, color: INK_45,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div style={{ width: 22, height: 2.5, background: AMBER, borderRadius: 2 }} />
  </div>
);

const ChipButton: React.FC<{
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}> = ({ active, label, count, onClick }) => (
  <button
    onClick={onClick}
    className="shrink-0 inline-flex items-center transition-all active:scale-[0.96]"
    style={{
      padding: '8px 14px',
      borderRadius: 30,
      background: active ? INK : '#FFFFFF',
      color: active ? '#FFFFFF' : INK_60,
      border: active ? '1px solid transparent' : `1px solid ${HAIR2}`,
      fontSize: 13, fontWeight: 600, gap: 6,
      fontFamily: GEIST,
    }}
  >
    {label}
    {count > 0 && (
      <span
        className="tabular-nums"
        style={{
          fontSize: 10.5, fontWeight: 800,
          padding: '2px 7px', borderRadius: 20,
          background: active ? 'rgba(255,255,255,0.18)' : AMBER_SOFT,
          color: active ? '#FFFFFF' : AMBER_DEEP,
          lineHeight: 1,
        }}
      >
        {count}
      </span>
    )}
  </button>
);

// ============ Page ============
const ActivityPage: React.FC = () => {
  useHideBottomNav();
  useHideHeader();

  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { isRehydrating } = useRehydrationSafe();
  const { markCoursesAsSeen } = useUnseenFriendReviews();

  const [chip, setChip] = useState<ChipKey>('all');
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActivityNotification | null>(null);

  const { data, isLoading, isFetching, error } = useActivityFeed('all', null);


  // Auto-mark seen on first load (parity with prior implementation).
  const hasMarkedSeen = useRef(false);
  useEffect(() => {
    if (hasMarkedSeen.current) return;
    if (!user?.id || isLoading) return;
    if (!data?.buckets?.new || data.buckets.new.length === 0) return;
    hasMarkedSeen.current = true;
    (async () => {
      const now = new Date().toISOString();
      queryClient.setQueryData(['user-profile', user.id], (old: any) => old ? { ...old, last_notifications_seen_at: now } : old);
      await supabase.from('user_profiles').update({ last_notifications_seen_at: now }).eq('id', user.id);
      markCoursesAsSeen();
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    })();
  }, [user?.id, isLoading, data, queryClient, markCoursesAsSeen]);

  // ── Auto mark-all-read on dwell (Item 1) ──
  // Industry-standard mark-read-on-view. When the Activity page has rendered
  // with real data (not skeletons) and there is at least one unread, start a
  // 1000ms dwell timer. On fire, batch-mark all unread server-side (same
  // mutation as the header button) and zero the tab/nav badge. Rows KEEP
  // their unread styling for the current viewing session (we do NOT patch
  // the feed cache) so nothing greys out mid-read; next visit renders read.
  // Cancels on unmount / tab hidden / navigation-away. Runs at most once per
  // visit — remount re-arms.
  const dwellFired = useRef(false);
  useEffect(() => {
    if (dwellFired.current) return;
    if (!user?.id || isLoading || !data) return;
    const hasUnread = (data.allItems ?? []).some((n: ActivityNotification) => n.is_unread);
    if (!hasUnread) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled || dwellFired.current) return;
      dwellFired.current = true;
      const now = new Date().toISOString();
      // Live badge clear — nav + tab pill go to zero immediately.
      queryClient.setQueryData(['activity-unread-count'], 0);
      try {
        await supabase.from('notifications').update({ is_read: true })
          .eq('user_id', user.id).lte('created_at', now);
        await supabase.from('user_profiles').update({ last_notifications_seen_at: now }).eq('id', user.id);
        // Only invalidate the badge count — do NOT invalidate the feed here
        // (that would flip row styling in the current session).
        queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      } catch { /* server error → dwell can re-arm on next visit */ }
    }, 1000);

    const onVis = () => { if (document.hidden) { cancelled = true; window.clearTimeout(timer); } };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.id, isLoading, data, queryClient]);

  useEffect(() => () => { queryClient.invalidateQueries({ queryKey: ['activity-feed'] }); }, [queryClient]);

  // NOTE: isRehydrating early-return moved BELOW the useMemos so hook order
  // stays stable across the rehydration flip (was crashing with
  // "Rendered more hooks than during the previous render").

  // ---- Mutations ----
  const handleMarkRead = async (id: string) => {
    const { error: err } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!err) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };
  const handleMarkUnread = async (id: string) => {
    const { error: err } = await supabase.from('notifications').update({ is_read: false }).eq('id', id);
    if (!err) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };
  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('notifications').update({ is_deleted: true }).eq('id', id);
    if (!err) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    }
  };
  const handleToggleRead = (n: ActivityNotification) => {
    if (n.is_mock) return;
    if (n.is_unread) handleMarkRead(n.id); else handleMarkUnread(n.id);
  };
  const handleDeleteNotification = (n: ActivityNotification) => {
    if (n.is_mock) return;
    handleDelete(n.id);
  };
  const openActionsSheet = (n: ActivityNotification) => {
    setSelectedNotification(n); setActionSheetOpen(true);
  };

  const handleNotificationClick = async (n: ActivityNotification) => {
    if (n.is_unread && !n.is_mock) await handleMarkRead(n.id);
    if (n.type === 'handicap_authority_live') {
      const countryId = (n as any).data?.country_id as string | undefined;
      navigate('/handicap', countryId ? { state: { preselectCountryId: countryId } } : undefined);
      return;
    }
    if (n.type === 'support_reply') {
      const ticketId = ((n as any).data?.ticket_id as string | undefined) ?? n.entity_id;
      if (ticketId) { navigate(`/support/thread/${ticketId}`); return; }
    }
    if (n.context_url && n.entity_type && n.entity_id) {
      const exists = await checkContentExists(n.entity_type, n.entity_id);
      if (!exists) {
        toast("Content unavailable", { description: "This content may have been deleted or removed." });
        handleDelete(n.id); return;
      }
    }
    if (n.context_url) navigate(n.context_url);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    // Optimistic: patch feed cache first
    queryClient.setQueriesData({ queryKey: ['activity-feed'] }, (old: any) => {
      if (!old) return old;
      const patch = (arr: ActivityNotification[]) => arr?.map((n) => ({ ...n, is_read: true, is_unread: false })) ?? arr;
      return {
        ...old,
        allItems: patch(old.allItems),
        buckets: old.buckets ? {
          new: [],
          today: patch(old.buckets.today),
          yesterday: patch(old.buckets.yesterday),
          thisWeek: patch(old.buckets.thisWeek),
          earlier: patch(old.buckets.earlier),
        } : old.buckets,
      };
    });
    queryClient.setQueryData(['activity-unread-count'], 0);

    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).lte('created_at', now);
    await supabase.from('user_profiles').update({ last_notifications_seen_at: now }).eq('id', user.id);
    queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    toast.success('All caught up');
  };

  const allItems = data?.allItems ?? [];

  // Unread counts per chip
  const unreadCounts = useMemo(() => {
    const counts: Record<ChipKey, number> = { all: 0, reviews: 0, friends: 0, mentions: 0 };
    for (const n of allItems) {
      if (!n.is_unread) continue;
      counts.all++;
      if (REVIEW_TYPES.has(n.type)) counts.reviews++;
      if (FRIEND_TYPES.has(n.type)) counts.friends++;
      if (MENTION_TYPES.has(n.type)) counts.mentions++;
    }
    return counts;
  }, [allItems]);

  // Build day groups from buckets, filtered by chip.
  const groups = useMemo(() => {
    const b = data?.buckets;
    if (!b) return [];
    // `new` is unread items across ALL dates (useActivityFeed filters purely
    // by is_unread). Naively concatenating `new` into Today while also
    // rendering yesterday/thisWeek/earlier duplicates any unread row from
    // an older bucket. Dedupe every date section against `new` by id so
    // each notification renders exactly once.
    // Repro before fix: any single unread friend_request / friend_accepted
    // row rendered twice (once in Today via `new`, once in its own bucket).
    const newItems = b.new ?? [];
    const newIds = new Set(newItems.map((n) => n.id));
    const dedupe = (arr: ActivityNotification[]) =>
      arr.filter((n) => !newIds.has(n.id));
    const combineToday = [...newItems, ...dedupe(b.today ?? [])];
    const sections = [
      { label: 'Today', items: combineToday.filter((n) => matchesChip(n, chip)) },
      { label: 'Yesterday', items: dedupe(b.yesterday ?? []).filter((n) => matchesChip(n, chip)) },
      { label: 'This week', items: dedupe(b.thisWeek ?? []).filter((n) => matchesChip(n, chip)) },
      { label: 'Earlier', items: dedupe(b.earlier ?? []).filter((n) => matchesChip(n, chip)) },
    ];
    return sections.filter((s) => s.items.length > 0);
  }, [data, chip]);

  if (isRehydrating) return <ActivityPageSkeleton />;

  const hasNotifications = allItems.length > 0;
  const showSkeleton = !data;
  const showEmptyState = !!data && !hasNotifications && !isFetching;
  const totalUnread = unreadCounts.all;

  const chips = (
    <div
      className="px-4 flex gap-2 overflow-x-auto scrollbar-none"
      style={{ paddingBottom: 12 }}
    >
      {CHIPS.map((c) => (
        <ChipButton
          key={c.key}
          active={chip === c.key}
          label={c.label}
          count={unreadCounts[c.key]}
          onClick={() => setChip(c.key)}
        />
      ))}
    </div>
  );

  const markAllRead = totalUnread > 0 ? (
    <button
      onClick={handleMarkAllRead}
      className="inline-flex items-center active:opacity-70"
      style={{
        gap: 5, padding: '6px 4px', background: 'transparent', border: 'none',
        color: INK_45, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        fontFamily: GEIST,
      }}
    >
      <CheckCheck size={14} strokeWidth={2.5} />
      Mark all read
    </button>
  ) : undefined;

  return (
    <ManagePageShell title="Notifications" right={markAllRead} belowTitle={chips}>
      <div style={{ background: PAGE, fontFamily: GEIST }}>
        {/* ============ Content ============ */}
        <div>
          {showSkeleton ? (
            <ActivitySkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: INK }}>Couldn't load activity</p>
              <p className="text-sm mb-6" style={{ color: INK_45 }}>Check your connection and try again</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['activity-feed'] })}
                className="px-6 py-2.5 text-sm font-bold rounded-full active:scale-[0.97] transition-transform"
                style={{ background: AMBER, color: '#ffffff' }}
              >
                Try again
              </button>
            </div>
          ) : showEmptyState ? (
            <ActivityEmptyState tab="all" />
          ) : groups.length === 0 ? (
            <ActivityEmptyState tab={chip} />
          ) : (
            groups.map((section, idx) => (
              <section key={section.label} style={idx > 0 ? { borderTop: `1px solid ${HAIR}` } : undefined}>
                <DayHeader label={section.label} />
                <NotificationList
                  items={section.items}
                  onClick={handleNotificationClick}
                  onOpenActionsSheet={openActionsSheet}
                  currentUserId={user?.id}
                />
              </section>
            ))
          )}
        </div>

        <NotificationActionsSheet
          open={actionSheetOpen}
          notification={selectedNotification}
          onClose={() => setActionSheetOpen(false)}
          onToggleRead={handleToggleRead}
          onDelete={handleDeleteNotification}
        />
        <ScrollToTopGlass />
      </div>
    </ManagePageShell>
  );
};


export default ActivityPage;
