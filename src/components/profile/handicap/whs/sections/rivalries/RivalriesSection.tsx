import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import RivalFightCard from './RivalFightCard';
import ManageRivalsSheet from './manage-sheet/ManageRivalsSheet';
import { useFriendRivalries, useFriendLeaderboard } from '@/lib/whs/hooks';
import { useFriendViewRivalriesForProfile } from '@/lib/whs/friendViewRivalries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useRivalCrowns, useRivalCrownsForOwner } from '@/lib/whs/hooks/useRivalCrowns';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { rivalKey, rivalryScore } from '@/lib/whs/utils/rivalryTiering';

interface Props {
  userId: string;
}

export const RivalriesSection: React.FC<Props> = ({ userId }) => {
  const { user } = useSupabaseSession();
  const viewerUserId = user?.id ?? null;
  const isFriendView = !!viewerUserId && viewerUserId !== userId;

  return isFriendView ? (
    <FriendViewRivalries viewerUserId={viewerUserId!} ownerUserId={userId} />
  ) : (
    <OwnerViewRivalries userId={userId} />
  );
};
export default RivalriesSection;

// ─── Owner view ───────────────────────────────────────────────────────────
const OwnerViewRivalries: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, isLoading } = useFriendRivalries(userId);
  const { data: ownerLeaderboard } = useFriendLeaderboard(userId);
  const ownerSelf = useMemo(
    () => ownerLeaderboard?.find((e) => e.is_self) ?? null,
    [ownerLeaderboard],
  );
  const youAvatar = ownerSelf
    ? pickAvatarSrc(ownerSelf.friend_thumbnail_url, ownerSelf.friend_profile_photo_url)
    : null;
  const { data: crownsByKey } = useRivalCrowns(userId);
  const [manageOpen, setManageOpen] = useState(false);

  const filledRivalries = useMemo(() => {
    const rows = (data ?? []).filter((r) => (r.shared_rounds_count ?? 0) > 0);
    // rivalryScore drives ordering: most-played + recently active first.
    return rows.sort((a, b) => rivalryScore(b) - rivalryScore(a));
  }, [data]);

  const activeCount = filledRivalries.length;
  const hasFilled = activeCount > 0;
  const eyebrow = activeCount > 0 ? `RIVALRIES · ${activeCount} ACTIVE` : 'RIVALRIES';

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow={eyebrow}
        title="Your rivals"
        sub={
          isLoading
            ? 'Loading…'
            : activeCount === 0
              ? 'Pick golfers to track head-to-head.'
              : 'All-time head-to-head record. A round counts when you and your rival played the same course on the same day.'
        }
        right={
          <button
            onClick={() => setManageOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid var(--hcp-line-2)',
              borderRadius: 999,
              cursor: 'pointer',
              color: 'var(--hcp-t-80)',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'Geist, system-ui, sans-serif',
            }}
          >
            <Settings2 size={13} strokeWidth={2.2} />
            Manage rivals
          </button>
        }
      />

      <div style={{ height: 10 }} />



      {isLoading ? (
        <div style={railStyle}>
          {Array.from({ length: 2 }).map((_, i) => <RivalrySkeleton key={i} />)}
        </div>
      ) : !hasFilled ? null : (
        <RivalCarousel rivalries={filledRivalries} crownsByKey={crownsByKey} youAvatar={youAvatar} />
      )}

      <ManageRivalsSheet
        userId={userId}
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </section>
  );
};

// ─── Friend view ──────────────────────────────────────────────────────────
const FriendViewRivalries: React.FC<{
  viewerUserId: string;
  ownerUserId: string;
}> = ({ viewerUserId, ownerUserId }) => {
  const { data, isLoading } = useFriendViewRivalriesForProfile(viewerUserId, ownerUserId);
  const { data: ownerLeaderboard } = useFriendLeaderboard(ownerUserId);
  const { data: viewerRivalries = [] } = useFriendRivalries(viewerUserId);
  const { data: crownsByKey } = useRivalCrownsForOwner(ownerUserId);

  const ownerRow = useMemo(
    () => ownerLeaderboard?.find((e) => e.is_self) ?? null,
    [ownerLeaderboard],
  );
  const ownerAvatar = ownerRow
    ? pickAvatarSrc(ownerRow.friend_thumbnail_url, ownerRow.friend_profile_photo_url)
    : null;

  const secondary = data?.secondary ?? [];

  const all = useMemo(() => {
    const arr: FriendRivalryHydrated[] = [...secondary];
    return arr
      .filter((r) => r.rival_user_id !== viewerUserId && r.rival_user_id !== ownerUserId)
      .filter((r) => (r.shared_rounds_count ?? 0) > 0)
      .sort((a, b) => rivalryScore(b) - rivalryScore(a));
  }, [secondary, viewerUserId, ownerUserId]);

  const viewerKnownRivalKeys = useMemo(() => {
    const s = new Set<string>();
    for (const r of viewerRivalries) {
      const k = rivalKey(r);
      if (k && (r.shared_rounds_count ?? 0) > 0) s.add(k);
    }
    return s;
  }, [viewerRivalries]);

  const isTapDisabled = useCallback(
    (r: FriendRivalryHydrated) => {
      const k = rivalKey(r);
      if (!k) return true;
      return !viewerKnownRivalKeys.has(k);
    },
    [viewerKnownRivalKeys],
  );

  const ownerFirst = useMemo(() => {
    const raw = ownerRow?.friend_name ?? null;
    if (!raw) return null;
    const reformatted = reformatFriendName(raw);
    return reformatted.split(' ')[0] ?? reformatted;
  }, [ownerRow]);

  const hasAnything = all.length > 0;
  const title = ownerFirst ? `${ownerFirst}'s rivals` : 'Their rivals';
  const sub = isLoading
    ? 'Loading…'
    : !hasAnything
      ? ownerFirst
        ? `No shared rivalries with ${ownerFirst} yet.`
        : 'No shared rivalries yet.'
      : 'Head-to-head with you and your shared friends.';

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader eyebrow="RIVALRIES" title={title} sub={sub} />
      {isLoading ? (
        <div style={railStyle}>
          {Array.from({ length: 2 }).map((_, i) => <RivalrySkeleton key={i} />)}
        </div>
      ) : !hasAnything ? null : (
        <RivalCarousel
          rivalries={all}
          crownsByKey={crownsByKey}
          friendViewOwnerId={ownerUserId}
          isTapDisabled={isTapDisabled}
          youLabel={ownerFirst ? ownerFirst.toUpperCase() : undefined}
          youAvatar={ownerAvatar}
        />

      )}
    </section>
  );
};

// ─── Carousel ─────────────────────────────────────────────────────────────
const RivalCarousel: React.FC<{
  rivalries: FriendRivalryHydrated[];
  crownsByKey?: Map<string, import('@/lib/whs/hooks/useRivalCrowns').RivalCrowns>;
  friendViewOwnerId?: string;
  isTapDisabled?: (r: FriendRivalryHydrated) => boolean;
  youLabel?: string;
  youAvatar?: string | null;
}> = ({ rivalries, crownsByKey, friendViewOwnerId, isTapDisabled, youLabel, youAvatar }) => {
  const navigate = useNavigate();
  const railRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);
  const total = rivalries.length;

  const onScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    setPage(Math.max(0, Math.min(total - 1, idx)));
  }, [total]);

  useEffect(() => {
    setPage(0);
  }, [total]);

  return (
    <>
      <div ref={railRef} onScroll={onScroll} style={heroRailStyle}>
        {rivalries.map((r, idx) => {
          const key = rivalKey(r) ?? `rival-${idx}`;
          const disabled = isTapDisabled ? isTapDisabled(r) : false;
          const onTap = disabled
            ? undefined
            : () => {
                const k = rivalKey(r);
                if (!k) return;
                if (friendViewOwnerId) {
                  navigate(`/handicap/${friendViewOwnerId}/rivalry/${k}`);
                } else {
                  navigate(`/handicap/rivalry/${k}`);
                }
              };
          return (
            <div
              key={key}
              style={{
                flex: '0 0 92%',
                scrollSnapAlign: 'center',
                minWidth: 0,
              }}
            >
              <RivalFightCard
                rivalry={r}
                crowns={crownsByKey?.get(key)}
                rank={idx + 1}
                total={total}
                onTap={onTap}
                youLabel={youLabel}
              />
            </div>
          );
        })}
      </div>
      {total > 1 && <DotPager count={total} active={page} />}
    </>
  );
};

const DotPager: React.FC<{ count: number; active: number }> = ({ count, active }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      marginBottom: 20,
    }}
  >
    {Array.from({ length: count }).map((_, i) => {
      const isActive = i === active;
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            height: 6,
            width: isActive ? 18 : 6,
            borderRadius: 3,
            background: isActive ? 'var(--hcp-t-100)' : 'var(--hcp-t-30)',
            transition: 'width 160ms ease, background 160ms ease',
          }}
        />
      );
    })}
  </div>
);

// ─── Shared atoms ─────────────────────────────────────────────────────────
const railStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  paddingTop: 4,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  willChange: 'transform',
  scrollbarWidth: 'none',
  boxSizing: 'border-box',
};

const heroRailStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  paddingTop: 4,
  paddingBottom: 4,
  paddingLeft: 16,
  paddingRight: 16,
  scrollPaddingLeft: 16,
  scrollPaddingRight: 16,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  willChange: 'transform',
  scrollbarWidth: 'none',
  boxSizing: 'border-box',
};

const RivalrySkeleton: React.FC = () => (
  <div
    className="animate-pulse"
    style={{
      flex: '0 0 100%',
      height: 380,
      borderRadius: 18,
      background: 'var(--hcp-bg-3)',
    }}
  />
);
