import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import RivalryCard from './RivalryCard';
import ManageRivalsSheet from './manage-sheet/ManageRivalsSheet';
import { useFriendRivalries, useFriendLeaderboard } from '@/lib/whs/hooks';
import { useFriendViewRivalriesForProfile } from '@/lib/whs/friendViewRivalries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import {
  assignRivalryTiers,
  rivalKey,
  type RivalryTier,
} from '@/lib/whs/utils/rivalryTiering';

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

// ─── Tier-aware splitting ──────────────────────────────────────────────────
function splitByTier(
  rivalries: FriendRivalryHydrated[],
  tiers: Map<string, RivalryTier>,
) {
  const hero: Array<{ r: FriendRivalryHydrated; tier: RivalryTier }> = [];
  const compact: Array<{ r: FriendRivalryHydrated; tier: RivalryTier }> = [];
  const empty: FriendRivalryHydrated[] = [];
  for (const r of rivalries) {
    const k = rivalKey(r);
    if (!k) continue;
    const t = tiers.get(k);
    if (t === 'archrival' || t === 'rival') hero.push({ r, tier: t });
    else if (t === 'recent') compact.push({ r, tier: t });
    else if (t === 'new') empty.push(r);
  }
  // Hero pager order: archrival first, then rival
  hero.sort((a, b) => {
    if (a.tier === b.tier) return 0;
    return a.tier === 'archrival' ? -1 : 1;
  });
  return { hero, compact, empty };
}

// ─── Owner view ───────────────────────────────────────────────────────────
const OwnerViewRivalries: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, isLoading } = useFriendRivalries(userId);
  const { data: leaderboard } = useFriendLeaderboard(userId);
  const selfRow = useMemo(
    () => leaderboard?.find((e) => e.is_self) ?? null,
    [leaderboard],
  );

  const [manageOpen, setManageOpen] = useState(false);

  const filledRivalries = useMemo(
    () => (data ?? []).slice().sort((a, b) => a.slot_index - b.slot_index),
    [data],
  );

  const tiers = useMemo(() => assignRivalryTiers(filledRivalries), [filledRivalries]);
  const { hero, compact, empty } = useMemo(
    () => splitByTier(filledRivalries, tiers),
    [filledRivalries, tiers],
  );

  const activeCount = useMemo(
    () => filledRivalries.filter((r) => (r.shared_rounds_count ?? 0) > 0).length,
    [filledRivalries],
  );
  const hasFilled = filledRivalries.length > 0;
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
              : 'Auto-picked from your most-played friends.'
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

      {isLoading ? (
        <div style={railStyle}>
          {Array.from({ length: 2 }).map((_, i) => <RivalrySkeleton key={i} />)}
        </div>
      ) : !hasFilled ? null : (
        <TieredRivalries hero={hero} compact={compact} empty={empty} />
      )}

      <ManageRivalsSheet
        userId={userId}
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </section>
  );
};

// ─── Friend view (file 13) ─────────────────────────────────────────────────
const FriendViewRivalries: React.FC<{
  viewerUserId: string;
  ownerUserId: string;
}> = ({ viewerUserId, ownerUserId }) => {
  const { data, isLoading } = useFriendViewRivalriesForProfile(viewerUserId, ownerUserId);
  const { data: ownerLeaderboard } = useFriendLeaderboard(ownerUserId);

  const ownerRow = useMemo(
    () => ownerLeaderboard?.find((e) => e.is_self) ?? null,
    [ownerLeaderboard],
  );

  const primary = data?.primary ?? null;
  const secondary = data?.secondary ?? [];

  const all = useMemo(() => {
    const arr: FriendRivalryHydrated[] = [];
    if (primary) arr.push(primary);
    arr.push(...secondary);
    return arr;
  }, [primary, secondary]);

  const tiers = useMemo(() => assignRivalryTiers(all), [all]);
  const { hero, compact, empty } = useMemo(
    () => splitByTier(all, tiers),
    [all, tiers],
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
        <TieredRivalries
          hero={hero}
          compact={compact}
          empty={empty}
          friendViewOwnerId={ownerUserId}
        />
      )}
    </section>
  );
};

// ─── Tier-aware renderer (hero pager + slim list) ──────────────────────────
const TieredRivalries: React.FC<{
  hero: Array<{ r: FriendRivalryHydrated; tier: RivalryTier }>;
  compact: Array<{ r: FriendRivalryHydrated; tier: RivalryTier }>;
  empty: FriendRivalryHydrated[];
  friendViewOwnerId?: string;
}> = ({ hero, compact, empty, friendViewOwnerId }) => {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);
  const total = hero.length;
  const hasMixedTiers = hero.some((h) => h.tier === 'archrival') && hero.some((h) => h.tier === 'rival');
  const portraitVariant: 'hero' | 'mixed' = hasMixedTiers ? 'mixed' : 'hero';

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
      {hero.length > 0 && (
        <>
          <div ref={railRef} onScroll={onScroll} style={heroRailStyle}>
            {hero.map(({ r, tier }, idx) => {
              const key = rivalKey(r) ?? `hero-${idx}`;
              return (
                <div
                  key={key}
                  style={{
                    flex: '0 0 100%',
                    scrollSnapAlign: 'center',
                    minWidth: 0,
                  }}
                >
                  <RivalryCard
                    rivalry={r}
                    tier={tier}
                    rank={idx + 1}
                    total={total}
                    variant="hero"
                    portraitVariant={portraitVariant}
                    friendViewOwnerId={friendViewOwnerId}
                  />
                </div>
              );
            })}
          </div>
          {hero.length > 1 && <DotPager count={hero.length} active={page} />}
        </>
      )}

      {(compact.length > 0 || empty.length > 0) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '14px 16px 8px',
          }}
        >
          {compact.map(({ r, tier }, idx) => {
            const key = rivalKey(r) ?? `compact-${idx}`;
            return (
              <RivalryCard
                key={key}
                rivalry={r}
                tier={tier}
                rank={hero.length + idx + 1}
                total={hero.length + compact.length}
                variant="compact"
                friendViewOwnerId={friendViewOwnerId}
              />
            );
          })}
          {empty.map((r, idx) => {
            const key = rivalKey(r) ?? `empty-${idx}`;
            return (
              <RivalryCard
                key={key}
                rivalry={r}
                tier="new"
                rank={0}
                total={0}
                variant="empty"
                friendViewOwnerId={friendViewOwnerId}
              />
            );
          })}
        </div>
      )}
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
            background: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
            transition: 'width 160ms ease, background 160ms ease',
          }}
        />
      );
    })}
  </div>
);

// ─── Shared atoms ──────────────────────────────────────────────────────────
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
      height: 460,
      borderRadius: 18,
      background: 'var(--hcp-bg-3)',
    }}
  />
);
