import React, { useState, useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import RivalryCard from './RivalryCard';
import RivalryAddCard from './RivalryAddCard';
import RivalryEditSheet from './RivalryEditSheet';
import { useFriendRivalries, useFriendLeaderboard } from '@/lib/whs/hooks';
import { useFriendViewRivalriesForProfile } from '@/lib/whs/friendViewRivalries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  /** The profile owner whose rivalries we're rendering. */
  userId: string;
}

/**
 * Renders the Rivalries section in two modes, decided by viewer-vs-owner identity:
 *
 *  • OWNER VIEW (viewer === userId): legacy behaviour. `useFriendRivalries` +
 *    `useFriendLeaderboard`, with edit/add affordances and the slot grid.
 *
 *  • FRIEND VIEW (viewer !== userId, file 13 / Phase 3): renders
 *    transitive-trust-filtered rivalries via `useFriendViewRivalriesForProfile`.
 *    Card 1 is always viewer-vs-owner ("YOU" vs the profile owner); subsequent
 *    cards are owner-vs-third-party rivalries where the viewer is also friends
 *    with that third party. No edit / add / slots. Card-tap routes to
 *    `/handicap/:ownerUserId/rivalry/:rivalUserId`.
 */
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

// ─── Owner view (unchanged legacy behaviour) ───────────────────────────────
const OwnerViewRivalries: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, isLoading } = useFriendRivalries(userId);
  const { data: leaderboard } = useFriendLeaderboard(userId);
  const selfRow = useMemo(
    () => leaderboard?.find((e) => e.is_self) ?? null,
    [leaderboard],
  );

  const [editTarget, setEditTarget] = useState<{ rivalry: FriendRivalryHydrated | null; slotIndex: number } | null>(null);

  const filledRivalries = useMemo(() => {
    return (data ?? []).slice().sort((a, b) => a.slot_index - b.slot_index);
  }, [data]);

  const nextAvailableSlot = useMemo(() => {
    const used = new Set(filledRivalries.map((r) => r.slot_index));
    for (let i = 0; i < 10; i++) {
      if (!used.has(i)) return i;
    }
    return null;
  }, [filledRivalries]);

  const hasFilled = filledRivalries.length > 0;

  const hasAnyH2HData = useMemo(() => {
    return filledRivalries.some((r) => {
      const sf = r.stableford_record ?? { wins: 0, losses: 0, ties: 0 };
      const gross = r.gross_record ?? { wins: 0, losses: 0, ties: 0 };
      return sf.wins + sf.losses + sf.ties + gross.wins + gross.losses + gross.ties > 0;
    });
  }, [filledRivalries]);

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="RIVALRIES"
        title="Your rivals"
        sub={
          isLoading
            ? 'Loading…'
            : !hasAnyH2HData
              ? 'Pick golfers to track head-to-head.'
              : 'Auto-picked from your circle. Pin to lock a slot.'
        }
        right={
          hasFilled && hasAnyH2HData ? (
            <button
              onClick={() => {
                const first = filledRivalries[0];
                setEditTarget({ rivalry: first, slotIndex: first.slot_index });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid var(--hcp-line-2)',
                borderRadius: 999,
                cursor: 'pointer',
                color: 'var(--hcp-t-80)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.14em',
              }}
            >
              <Pencil size={11} strokeWidth={2.4} />
              EDIT
            </button>
          ) : null
        }
      />

      <div style={railStyle}>
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <RivalrySkeleton key={i} />)
        ) : !hasAnyH2HData ? (
          <RivalryAddCard
            slotIndex={0}
            label="Add a rival"
            onClick={() => setEditTarget({ rivalry: null, slotIndex: 0 })}
          />
        ) : (
          <>
            {filledRivalries.map((rivalry) => (
              <RivalryCard
                key={`slot-${rivalry.slot_index}`}
                rivalry={rivalry}
                userName={selfRow?.friend_name ?? null}
                userThumbnailUrl={selfRow?.friend_thumbnail_url ?? null}
                userHandicap={selfRow?.friend_handicap_index ?? null}
                onInfo={() => { /* deprecated */ }}
              />
            ))}
            {nextAvailableSlot !== null && (
              <RivalryAddCard
                slotIndex={nextAvailableSlot}
                label="Add a rival"
                onClick={() => setEditTarget({ rivalry: null, slotIndex: nextAvailableSlot })}
              />
            )}
          </>
        )}
      </div>

      <RivalryEditSheet
        userId={userId}
        rivalry={editTarget?.rivalry ?? null}
        slotIndex={editTarget?.slotIndex ?? null}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </section>
  );
};

// ─── Friend view (file 13 / Phase 3) ───────────────────────────────────────
const FriendViewRivalries: React.FC<{
  viewerUserId: string;
  ownerUserId: string;
}> = ({ viewerUserId, ownerUserId }) => {
  const { data, isLoading } = useFriendViewRivalriesForProfile(viewerUserId, ownerUserId);
  // Owner's friend leaderboard: gives us owner's self row AND the viewer's
  // hydrated row (used to populate "YOU" portrait in the primary card).
  const { data: ownerLeaderboard } = useFriendLeaderboard(ownerUserId);

  const ownerRow = useMemo(
    () => ownerLeaderboard?.find((e) => e.is_self) ?? null,
    [ownerLeaderboard],
  );
  const viewerRow = useMemo(
    () => ownerLeaderboard?.find((e) => e.friend_user_id === viewerUserId) ?? null,
    [ownerLeaderboard, viewerUserId],
  );

  const primary = data?.primary ?? null;
  const secondary = data?.secondary ?? [];
  const hasAnything = !!primary || secondary.length > 0;

  const ownerFirst = useMemo(() => {
    const raw = ownerRow?.friend_name ?? null;
    if (!raw) return null;
    const reformatted = reformatFriendName(raw);
    return reformatted.split(' ')[0] ?? reformatted;
  }, [ownerRow]);

  const ownerLabel = ownerFirst ? ownerFirst.toUpperCase() : null;

  const title = ownerFirst ? `${ownerFirst}'s rivals` : 'Their rivals';
  const sub = isLoading
    ? 'Loading…'
    : !hasAnything
      ? ownerFirst
        ? `No rivalries with ${ownerFirst} or your shared friends yet.`
        : 'No shared rivalries yet.'
      : 'Head-to-head with you and your shared friends.';

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader eyebrow="RIVALRIES" title={title} sub={sub} />

      <div style={railStyle}>
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <RivalrySkeleton key={i} />)
        ) : !hasAnything ? null : (
          <>
            {primary && (
              <RivalryCard
                key="primary-viewer-vs-owner"
                rivalry={primary}
                userName={viewerRow?.friend_name ?? null}
                userThumbnailUrl={viewerRow?.friend_thumbnail_url ?? null}
                userHandicap={viewerRow?.friend_handicap_index ?? null}
                selfLabel="YOU"
                friendViewOwnerId={ownerUserId}
                onInfo={() => { /* deprecated */ }}
              />
            )}
            {secondary.map((rivalry) => {
              const key = rivalry.rival_user_id ?? rivalry.rival_friend_row_id ?? Math.random().toString();
              return (
                <RivalryCard
                  key={`secondary-${key}`}
                  rivalry={rivalry}
                  userName={ownerRow?.friend_name ?? null}
                  userThumbnailUrl={ownerRow?.friend_thumbnail_url ?? null}
                  userHandicap={ownerRow?.friend_handicap_index ?? null}
                  selfLabel={ownerLabel}
                  friendViewOwnerId={ownerUserId}
                  onInfo={() => { /* deprecated */ }}
                />
              );
            })}
          </>
        )}
      </div>
    </section>
  );
};

// ─── Shared atoms ──────────────────────────────────────────────────────────
const railStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  paddingTop: 4,
  paddingBottom: 8,
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
      flex: '0 0 auto',
      width: 264,
      height: 220,
      borderRadius: 18,
      background: 'var(--hcp-bg-3)',
    }}
  />
);
