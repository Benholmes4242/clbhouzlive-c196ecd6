import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { startOfDay, startOfWeek, subDays } from 'date-fns';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useActiveActor } from '@/context/ActiveActorContext';
import { supabase } from '@/integrations/supabase/client';

import {
  useActivityFeedV2,
  type ActivityFilterV2,
  type ActivityFeedRowV2,
} from './hooks/useActivityFeedV2';
import { useRecordsUnreadCount } from './hooks/useRecordsUnreadCount';
import { GAME_NOTIF_TYPES } from './components/ledgerKinds';
import { FeaturedMomentCard, pickFeaturedRow } from './components/FeaturedMomentCard';
import { FriendRequestsRail } from './components/FriendRequestsRail';
import { FIGURE } from '@/lib/tokens/type';
import { LedgerRow } from './components/LedgerRow';
import { ActivityActionsSheet } from './components/ActivityActionsSheet';
import { ActivityRowsSkeleton } from '@/components/skeletons/ActivityPageSkeleton';

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_60 = '#475569';
const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#C97A10';
const HAIR2 = 'rgba(15,23,42,0.10)';
const PAGE = '#F8FAFC';

type ChipKey = 'all' | 'new' | 'mentions' | 'friends' | 'crowns';
const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'friends', label: 'Friends' },
  // Game family (level ups, crowns, streaks). Server-side these types are
  // excluded from every other chip, so this is their only home in Activity.
  //
  // Label is Records, key is crowns. The key is the RPC's p_filter value and
  // the ?filter=crowns deep link target — it is an API contract, not a
  // display string. The family is thirteen types: level ups, tier
  // near-misses, legends, crowns, three streak types, status changes, rivals
  // and badges. 'Records' was chosen over 'Crowns' and 'Legends' because
  // both of those name two of the thirteen.
  { key: 'crowns', label: 'Records' },
];
const chipToFilter = (c: ChipKey): ActivityFilterV2 =>
  c === 'all' ? null : (c as ActivityFilterV2);

// -- Empty copy per chip ------------------------------------------------
const EMPTY_COPY: Record<ChipKey, { title: string; sub: string }> = {
  all: { title: 'No activity yet', sub: 'When people react, reply, or follow you, it lands here.' },
  new: { title: 'All caught up', sub: 'Nothing new since your last visit.' },
  mentions: { title: 'No mentions yet', sub: 'When someone @-mentions you, it shows up here.' },
  friends: { title: 'No friend activity yet', sub: 'Follow people and their moves will appear here.' },
  crowns: { title: 'No records yet', sub: 'Course records, crowns, tiers and streaks land here as you play.' },
};

interface ChipProps {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}
const ChipButton: React.FC<ChipProps> = ({ active, label, count, onClick }) => (
  <button
    onClick={onClick}
    className="shrink-0 inline-flex items-center transition-all active:scale-[0.96]"
    style={{
      padding: '8px 14px',
      borderRadius: 30,
      background: active ? INK : '#FFFFFF',
      color: active ? '#FFFFFF' : INK_60,
      border: active ? '1px solid transparent' : `1px solid ${HAIR2}`,
      gap: 6,
      fontFamily: SF_STACK,
      fontSize: 13,
      fontWeight: 600,
    }}
  >
    {label}
    {typeof count === 'number' && count > 0 && (
      <span
        style={{
          ...FIGURE,
          fontSize: 10.5,
          padding: '2px 7px',
          borderRadius: 20,
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

// -- Section header (dispatch caps) ------------------------------------
const SectionHeader: React.FC<{ label: string; tone?: 'new' | 'date' }> = ({ label, tone = 'date' }) => (
  <div
    style={{
      padding: '18px 18px 8px',
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#94A3B8',
      fontFamily: SF_STACK,
    }}
  >
    {label}
  </div>
);

// -- Bucket labels (legacy: new / today / yesterday / thisWeek / earlier)
// From groupNotificationsByDateBucket in src/hooks/useActivityFeed.ts.
const BUCKET_LABELS: Record<'new' | 'today' | 'yesterday' | 'thisWeek' | 'earlier', string> = {
  new: 'New',
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  earlier: 'Earlier',
};

function bucketise(rows: ActivityFeedRowV2[], visitUnreadIds: Set<string>) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const newBucket: ActivityFeedRowV2[] = [];
  const today: ActivityFeedRowV2[] = [];
  const yesterday: ActivityFeedRowV2[] = [];
  const thisWeek: ActivityFeedRowV2[] = [];
  const earlier: ActivityFeedRowV2[] = [];

  const seen = new Set<string>();
  for (const r of rows) {
    // visit-snapshot: rows unread at page-open (or arriving unread mid-visit)
    // stay in "New" even if a realtime-triggered refetch returns them read.
    if (!r.is_read || visitUnreadIds.has(r.notif_id)) {
      newBucket.push(r);
      seen.add(r.notif_id);
    }
  }
  for (const r of rows) {
    if (seen.has(r.notif_id)) continue;
    const created = new Date(r.created_at);
    if (created >= todayStart) today.push(r);
    else if (created >= yesterdayStart) yesterday.push(r);
    else if (created >= weekStart) thisWeek.push(r);
    else earlier.push(r);
  }

  return { new: newBucket, today, yesterday, thisWeek, earlier };
}


export const ActivityPageV2: React.FC = () => {
  useHideBottomNav();
  useHideHeader();

  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const { unreadCount } = useUnreadNotifications();

  const recipientActorType: 'personal' | 'business' =
    activeActor?.type === 'business' ? 'business' : 'personal';
  const recipientActorId = activeActor?.id ?? user?.id ?? '';


  // ?filter=crowns deep link: the retired gam NotificationsSheet's entry
  // points land here, so the initial chip honours the query param once.
  const [searchParams] = useSearchParams();
  const initialChip: ChipKey = (() => {
    const f = searchParams.get('filter');
    return CHIPS.some((c) => c.key === f) ? (f as ChipKey) : 'all';
  })();
  const [chip, setChip] = useState<ChipKey>(initialChip);
  /**
   * ONE PREDICATE FOR "NEW" (BRIEF_ACTIVITY_NEW_TAB_AND_LIKE_COUNTS §1.3).
   *
   * The server's p_filter='new' is `n.is_read = false`, evaluated at request
   * time. The chip count and the NEW section are `!is_read || visit-snapshot`,
   * evaluated against the rows already on screen. Those two disagree the moment
   * anything marks read mid-visit, which is exactly the reported fault: chip
   * said 2, the New tab said "all caught up".
   *
   * So the New chip DOES NOT ask the server for a filtered page. It reads the
   * SAME rows the All tab reads and applies the SAME predicate as bucketise().
   * The chip count and the New tab list are then literally the same array and
   * can never diverge.
   */
  const filter = chipToFilter(chip === 'new' ? 'all' : chip);
  const feed = useActivityFeedV2(filter);

  const [sheetRow, setSheetRow] = useState<ActivityFeedRowV2 | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const firstPage = feed.data?.pages?.[0] ?? [];
  const allRows: ActivityFeedRowV2[] = useMemo(
    () => (feed.data?.pages ?? []).flat(),
    [feed.data],
  );


  // Visit snapshot: capture notif_ids that were unread at any point during
  // this visit. Keeps them presented as "New" even after auto-read + a
  // realtime-triggered mid-visit refetch returns them with is_read=true.
  const visitUnreadIds = useRef<Set<string>>(new Set());

  // Records read-scope (§3.1). A REF, not state: it must not re-render and must
  // not reset on a mid-visit refetch. It resets on unmount — one visit.
  const visitedRecordsRef = useRef(false);
  useEffect(() => {
    if (chip === 'crowns') visitedRecordsRef.current = true;
  }, [chip]);
  useEffect(() => {
    for (const r of allRows) {
      if (!r.is_read) visitUnreadIds.current.add(r.notif_id);
    }
  }, [allRows]);

  const featured = useMemo(() => pickFeaturedRow(firstPage), [firstPage]);
  const buckets = useMemo(
    () => bucketise(allRows, visitUnreadIds.current),
    [allRows],
  );


  // Optimistic single-row mark-read ----
  // NOTE: only touch the local 'activity-v2' cache so the visible dot state
  // remains through the visit; badges are refreshed via invalidation which
  // re-runs the pure is_read=false count.
  const markRead = async (notifId: string) => {
    type FeedCache = { pages: ActivityFeedRowV2[][]; pageParams: unknown[] };
    qc.setQueriesData<FeedCache>({ queryKey: ['activity-v2'] }, (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((p) =>
          p.map((r) => (r.notif_id === notifId ? { ...r, is_read: true } : r)),
        ),
      };
    });
    // Both read-state columns (§2), so the two can never drift further.
    await supabase.from('notifications').update({ is_read: true, read: true }).eq('id', notifId);

    qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
    qc.invalidateQueries({ queryKey: ['actor-unread-counts'] });
    qc.invalidateQueries({ queryKey: ['records-unread-count'] });
  };

  const openSheet = (row: ActivityFeedRowV2) => {
    setSheetRow(row);
    setSheetOpen(true);
  };

  // -- Auto-read ON EXIT, NEVER ON ARRIVAL ----------------------------
  //
  // BRIEF_ACTIVITY_NEW_TAB_AND_LIKE_COUNTS §1.2. This ran on MOUNT, which is
  // the exact failure the Discover "new since you last looked" work already
  // ruled out: the marker is cleared before the member can read it. Landing on
  // Activity flipped every row read, so tapping the New chip (server predicate
  // is_read=false) returned nothing while the chip still counted the visit
  // snapshot. Marking read on view stays — it just happens when they LEAVE.
  //
  // SCOPE (BRIEF_RECORDS_TAB_COUNT_AND_READ_SCOPE §2): game-family types are
  // swept ONLY IF the Records tab was actually viewed during this visit.
  // The same principle that moved this to exit applies to the scope — a
  // count the member never saw must not be cleared by a visit to a different
  // tab. Records rows are excluded from every other chip server-side
  // (get_activity_feed :107-108), so landing on Activity does not show them
  // and must not read them.
  //
  // Signals: visibilitychange -> hidden (the dependable background signal in
  // the Median WebView, it fires before suspension so the write dispatches)
  // plus unmount, which always fires. Never on mount, tab change or scroll.
  //
  // The stamp (user_profiles.last_notifications_seen_at) is SERVER-SIDE but
  // does NOT go through mark_surface_seen, so GREATEST is not doing the work:
  // monotonicity is enforced here by only writing rows whose current stamp is
  // null or older than this one.
  const markReadOnExitRef = useRef<() => void>(() => {});
  markReadOnExitRef.current = () => {
    if (!recipientActorId || !user?.id) return;
    const now = new Date().toISOString();
    void (async () => {
      let sweep = supabase
        .from('notifications')
        // Both columns, always — see §2. `read` is abandoned but must not
        // drift further apart from is_read.
        .update({ is_read: true, read: true })
        .eq('recipient_actor_type', recipientActorType)
        .eq('recipient_actor_id', recipientActorId)
        .eq('is_read', false)
        .neq('type', 'friend_request')
        .lte('created_at', now);
      if (!visitedRecordsRef.current) {
        sweep = sweep.not('type', 'in', `(${GAME_NOTIF_TYPES.join(',')})`);
      }
      await sweep;
      await supabase
        .from('user_profiles')
        .update({ last_notifications_seen_at: now })
        .eq('id', user.id)
        .or(`last_notifications_seen_at.is.null,last_notifications_seen_at.lt.${now}`);
      qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
      qc.invalidateQueries({ queryKey: ['actor-unread-counts'] });
      qc.invalidateQueries({ queryKey: ['records-unread-count'] });
    })();
  };

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) markReadOnExitRef.current();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      markReadOnExitRef.current();
    };
  }, []);


  // -- Mark-all-read (actor-scoped) -----------------------------------
  const handleMarkAllRead = async () => {
    if (!user?.id || !recipientActorId) return;
    const now = new Date().toISOString();
    const { error: notifErr } = await supabase
      .from('notifications')
      // Both read-state columns (§2).
      .update({ is_read: true, read: true })
      .eq('recipient_actor_type', recipientActorType)
      .eq('recipient_actor_id', recipientActorId)
      .eq('is_read', false)
      .neq('type', 'friend_request')
      .lte('created_at', now);
    const { error: seenErr } = await supabase
      .from('user_profiles')
      .update({ last_notifications_seen_at: now })
      .eq('id', user.id)
      // Monotonic: the stamp only ever moves forwards.
      .or(`last_notifications_seen_at.is.null,last_notifications_seen_at.lt.${now}`);
    if (notifErr || seenErr) {
      toast.error("Couldn't mark all read. Try again.");
      return;
    }
    // Explicit "mark all read" is the ONE place the visit snapshot is dropped:
    // the member asked for the New marker to go, so the chip must fall to 0.
    visitUnreadIds.current.clear();
    // Explicit mark-all clears Records too, so a later exit in this same visit
    // cannot re-run a sweep that has nothing left to do (§3.4).
    visitedRecordsRef.current = false;
    qc.invalidateQueries({ queryKey: ['activity-v2'] });
    qc.invalidateQueries({ queryKey: ['activity-feed'] });
    qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
    qc.invalidateQueries({ queryKey: ['actor-unread-counts'] });
    qc.invalidateQueries({ queryKey: ['records-unread-count'] });

    toast.success('All caught up');
  };



  // -- Infinite sentinel ----------------------------------------------
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
          }
        }
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);

  const chips = (
    <div className="px-4 flex gap-2 overflow-x-auto scrollbar-none" style={{ paddingBottom: 12 }}>
      {CHIPS.map((c) => (
        <ChipButton
          key={c.key}
          active={chip === c.key}
          label={c.label}
          // "New" chip count equals the highlighted rows on screen (same
          // definition as bucketise -> !is_read) so the two never drift.
          count={
            c.key === 'new'
              ? buckets.new.length
              : c.key === 'crowns'
                ? recordsUnread
                : undefined
          }
          onClick={() => setChip(c.key)}
        />
      ))}
    </div>
  );

  const markAllRead = unreadCount > 0 ? (
    <button
      onClick={handleMarkAllRead}
      className="inline-flex items-center active:opacity-70"
      style={{
        gap: 5,
        padding: '6px 4px',
        background: 'transparent',
        border: 'none',
        color: INK_60,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: SF_STACK,
      }}
    >
      <CheckCheck size={14} strokeWidth={2.5} />
      Mark all read
    </button>
  ) : undefined;

  const renderBucket = (
    label: string,
    rows: ActivityFeedRowV2[],
    tone: 'new' | 'date' = 'date',
  ) => {
    if (rows.length === 0) return null;
    return (
      <section key={label}>
        <SectionHeader label={label} tone={tone} />
        <div>
          {rows.map((r) => (
            <LedgerRow key={r.notif_id} row={r} onMarkRead={markRead} onLongPress={openSheet} />
          ))}
        </div>
      </section>
    );
  };

  // On the New chip the visible rows ARE buckets.new — the same array the chip
  // counts (§1.3/§1.4: the All tab's NEW section is authoritative).
  const isNewChip = chip === 'new';
  const visibleRows = isNewChip ? buckets.new : allRows;

  const isErrored = feed.isError && allRows.length === 0;
  const isEmpty = !feed.isLoading && !feed.isError && visibleRows.length === 0;


  return (
    <ManagePageShell
      title="Activity"
      onBack={() => navigate(-1)}
      right={markAllRead}
      belowTitle={chips}
    >
      <div style={{ background: PAGE, fontFamily: SF_STACK, minHeight: '100%' }}>
        {featured && <FeaturedMomentCard row={featured} />}
        <FriendRequestsRail />

        {feed.isLoading && <ActivityRowsSkeleton buckets={2} />}

        {isErrored && (
          <div
            style={{
              padding: '60px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: INK_60,
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
              Couldn't load your activity
            </div>
            <button
              type="button"
              onClick={() => feed.refetch()}
              style={{
                background: INK,
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: SF_STACK,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {isEmpty && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: INK_60 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 6 }}>
              {EMPTY_COPY[chip].title}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: INK_60 }}>
              {EMPTY_COPY[chip].sub}
            </div>
          </div>
        )}

        {!isEmpty && !isErrored && !feed.isLoading && (
          <div style={{ paddingBottom: 40 }}>
            {isNewChip ? (
              renderBucket(BUCKET_LABELS.new, buckets.new, 'new')
            ) : (
              <>
                {renderBucket(BUCKET_LABELS.new, buckets.new, 'new')}
                {renderBucket(BUCKET_LABELS.today, buckets.today)}
                {renderBucket(BUCKET_LABELS.yesterday, buckets.yesterday)}
                {renderBucket(BUCKET_LABELS.thisWeek, buckets.thisWeek)}
                {renderBucket(BUCKET_LABELS.earlier, buckets.earlier)}
              </>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {feed.isFetchingNextPage && (
              <div style={{ padding: '8px 0' }}>
                <ActivityRowsSkeleton buckets={1} />
              </div>
            )}
          </div>
        )}

        <ActivityActionsSheet
          open={sheetOpen}
          row={sheetRow}
          onClose={() => setSheetOpen(false)}
        />
      </div>
    </ManagePageShell>
  );
};

export default ActivityPageV2;
