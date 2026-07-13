import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { startOfDay, startOfWeek, subDays } from 'date-fns';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { supabase } from '@/integrations/supabase/client';
import {
  useActivityFeedV2,
  type ActivityFilterV2,
  type ActivityFeedRowV2,
} from './hooks/useActivityFeedV2';
import { FeaturedMomentCard, pickFeaturedRow } from './components/FeaturedMomentCard';
import { FriendRequestsRail } from './components/FriendRequestsRail';
import { LedgerRow } from './components/LedgerRow';
import { ActivityActionsSheet } from './components/ActivityActionsSheet';

const GEIST =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_60 = '#475569';
const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#C97A10';
const HAIR2 = 'rgba(15,23,42,0.10)';
const PAGE = '#F8FAFC';

type ChipKey = 'all' | 'new' | 'mentions' | 'friends';
const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'friends', label: 'Friends' },
];
const chipToFilter = (c: ChipKey): ActivityFilterV2 =>
  c === 'all' ? null : (c as ActivityFilterV2);

// -- Empty copy per chip ------------------------------------------------
const EMPTY_COPY: Record<ChipKey, { title: string; sub: string }> = {
  all: { title: 'No activity yet', sub: 'When people react, reply, or follow you, it lands here.' },
  new: { title: 'All caught up', sub: 'Nothing new since your last visit.' },
  mentions: { title: 'No mentions yet', sub: 'When someone @-mentions you, it shows up here.' },
  friends: { title: 'No friend activity yet', sub: 'Follow people and their moves will appear here.' },
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
      fontFamily: GEIST,
      fontSize: 13,
      fontWeight: 600,
    }}
  >
    {label}
    {typeof count === 'number' && count > 0 && (
      <span
        className="tabular-nums"
        style={{
          fontSize: 10.5,
          fontWeight: 800,
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
      color: tone === 'new' ? AMBER_DEEP : INK_60,
      fontFamily: GEIST,
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

function bucketise(rows: ActivityFeedRowV2[]) {
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
    if (!r.is_read) {
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
  const { unreadCount } = useUnreadNotifications();

  const [chip, setChip] = useState<ChipKey>('all');
  const filter = chipToFilter(chip);
  const feed = useActivityFeedV2(filter);

  const [sheetRow, setSheetRow] = useState<ActivityFeedRowV2 | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const firstPage = feed.data?.pages?.[0] ?? [];
  const allRows: ActivityFeedRowV2[] = useMemo(
    () => (feed.data?.pages ?? []).flat(),
    [feed.data],
  );
  const featured = useMemo(() => pickFeaturedRow(firstPage), [firstPage]);
  const buckets = useMemo(() => bucketise(allRows), [allRows]);

  // Optimistic single-row mark-read ----
  const markRead = async (notifId: string) => {
    qc.setQueriesData({ queryKey: ['activity-v2'] }, (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((p: ActivityFeedRowV2[]) =>
          p.map((r) => (r.notif_id === notifId ? { ...r, is_read: true } : r)),
        ),
      };
    });
    qc.setQueryData(['activity-unread-count'], (n: any) =>
      typeof n === 'number' && n > 0 ? n - 1 : n,
    );
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
  };

  const openSheet = (row: ActivityFeedRowV2) => {
    setSheetRow(row);
    setSheetOpen(true);
  };

  // -- Mark-all-read (legacy write path) ------------------------------
  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    qc.setQueryData(['activity-unread-count'], 0);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .lte('created_at', now);
    await supabase
      .from('user_profiles')
      .update({ last_notifications_seen_at: now })
      .eq('id', user.id);
    qc.invalidateQueries({ queryKey: ['activity-v2'] });
    qc.invalidateQueries({ queryKey: ['activity-feed'] });
    qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
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
          count={c.key === 'new' ? unreadCount : undefined}
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
        fontFamily: GEIST,
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

  const isEmpty = !feed.isLoading && allRows.length === 0;

  return (
    <ManagePageShell
      title="Activity"
      onBack={() => navigate(-1)}
      right={markAllRead}
      belowTitle={chips}
    >
      <div style={{ background: PAGE, fontFamily: GEIST, minHeight: '100%' }}>
        {featured && <FeaturedMomentCard row={featured} />}
        <FriendRequestsRail />

        {feed.isLoading && (
          <div style={{ padding: 24, color: INK_60, fontSize: 13, textAlign: 'center' }}>
            Loading…
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

        {!isEmpty && !feed.isLoading && (
          <div style={{ paddingBottom: 40 }}>
            {renderBucket(BUCKET_LABELS.new, buckets.new, 'new')}
            {renderBucket(BUCKET_LABELS.today, buckets.today)}
            {renderBucket(BUCKET_LABELS.yesterday, buckets.yesterday)}
            {renderBucket(BUCKET_LABELS.thisWeek, buckets.thisWeek)}
            {renderBucket(BUCKET_LABELS.earlier, buckets.earlier)}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {feed.isFetchingNextPage && (
              <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={18} color={AMBER} className="animate-spin" />
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
