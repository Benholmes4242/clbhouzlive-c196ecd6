import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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

const GEIST =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_60 = '#475569';
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

  const firstPage = feed.data?.pages?.[0] ?? [];
  const allRows: ActivityFeedRowV2[] = useMemo(
    () => (feed.data?.pages ?? []).flat(),
    [feed.data],
  );
  const featured = useMemo(() => pickFeaturedRow(firstPage), [firstPage]);

  // Mark-all-read — mirrors legacy ActivityPage.handleMarkAllRead write path.
  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    qc.setQueryData(['activity-unread-count'], 0);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).lte('created_at', now);
    await supabase.from('user_profiles').update({ last_notifications_seen_at: now }).eq('id', user.id);
    qc.invalidateQueries({ queryKey: ['activity-v2'] });
    qc.invalidateQueries({ queryKey: ['activity-feed'] });
    qc.invalidateQueries({ queryKey: ['activity-unread-count'] });
    toast.success('All caught up');
  };

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

        {/* N3: ledger */}
        <div style={{ padding: '20px 16px 40px' }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_60,
              marginBottom: 10,
            }}
          >
            Feed (dev preview)
          </div>
          {feed.isLoading ? (
            <div style={{ color: INK_60, fontSize: 13 }}>Loading…</div>
          ) : allRows.length === 0 ? (
            <div style={{ color: INK_60, fontSize: 13 }}>No activity yet.</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {allRows.slice(0, 30).map((r) => (
                <li
                  key={r.notif_id}
                  style={{
                    padding: '10px 0',
                    borderBottom: `1px solid ${HAIR2}`,
                    color: INK,
                    fontSize: 13,
                    fontWeight: r.is_read ? 500 : 700,
                  }}
                >
                  {r.title || r.message || `${r.notif_type} · ${r.notif_id.slice(0, 6)}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ManagePageShell>
  );
};

export default ActivityPageV2;
