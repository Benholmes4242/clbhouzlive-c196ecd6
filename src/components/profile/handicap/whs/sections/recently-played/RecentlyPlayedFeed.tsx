/**
 * RecentlyPlayedFeed - friends' rounds, as rows.
 *
 * One house row per round, two lines each, inside a single panel. The action
 * for an unconnected friend lives on the row itself (in the columns their
 * round leaves empty), so there is no footer restating it.
 *
 * Renders NOTHING when there are no rounds.
 */
import React, { useState } from 'react';
import { useFriendsActivity } from '@/lib/whs/hooks';
import { Skeleton } from '@/components/ui/skeleton';

import FriendRoundRow, { type FriendRoundVariant } from './FriendRoundRow';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import { CHART } from '../../charts';
import type { WhsFriendActivityWithImage, FriendLeaderboardEntry } from '@/lib/whs/types';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';

interface Props {
  ownerUserId: string;
}

const toWhsOnlyEntry = (a: WhsFriendActivityWithImage): FriendLeaderboardEntry => ({
  is_self: false,
  friend_user_id: null,
  friend_connection_id: a.friend_connection_id,
  friend_passport_id: a.friend_passport_id ?? null,
  friend_row_id: a.friend_row_id ?? null,
  friend_name: a.friend_name,
  friend_thumbnail_url: a.friend_thumbnail_url,
  friend_profile_photo_url: a.friend_profile_photo_url ?? null,
  friend_handicap_index: a.friend_handicap_index,
  friend_home_club: null,
  last_round_played_at: a.last_round_played_at,
  last_round_course_name: a.last_round_course_name,
  is_clbhouz_user: false,
  handicap_30d_ago: null,
  handicap_30d_delta: null,
  rounds_last_30d: 0,
});

const variantFor = (a: WhsFriendActivityWithImage): FriendRoundVariant =>
  a.is_clbhouz_user && a.friend_connection_id
    ? 'clbhouz-synced'
    : a.is_clbhouz_user
      ? 'clbhouz-not-synced'
      : 'eg-only';

export const RecentlyPlayedFeed: React.FC<Props> = ({ ownerUserId }) => {
  // SETTLED IS NOT "NOT LOADING" — useFriendsActivity is gated on ownerUserId,
  // so a disabled query is isLoading:false before it has ever run. Deciding
  // "no rounds, render nothing" from !isLoading hides the section on first paint.
  const { data, isLoading: fetching, isFetched } = useFriendsActivity(ownerUserId);
  const isLoading = !isFetched || fetching;

  const [sheetActivity, setSheetActivity] =
    useState<WhsFriendActivityWithImage | null>(null);
  const { resolve } = useMemberTapResolver();

  const handleOpen = (item: WhsFriendActivityWithImage) => {
    // State D — Not a Clbhouz user (or unresolvable user_id) → invite
    if (!item.is_clbhouz_user || !item.friend_user_id) {
      void resolve({ whsOnlyEntry: toWhsOnlyEntry(item) });
      return;
    }
    // State C — Clbhouz member, no handicap connected → nudge to sync, NOT an
    // invite-to-clbhouz: they are already here.
    if (!item.friend_connection_id) {
      void resolve({ targetUserId: item.friend_user_id });
      return;
    }
    // State B — Synced member, no detailed scorecard for this round → compare
    if (!item.last_round_score_id) {
      void resolve({ targetUserId: item.friend_user_id });
      return;
    }
    // State A — Synced + has scorecard → real scorecard sheet
    setSheetActivity(item);
  };

  const items = data ?? [];

  // Nothing at all when the fortnight is empty.
  // eslint-disable-next-line settled/no-not-loading-empty-check -- isLoading is derived as !isFetched || fetching above.
  if (!isLoading && items.length === 0) return null;

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="FRIENDS' ROUNDS"
        right={!isLoading ? `LAST FORTNIGHT \u00B7 ${items.length}` : undefined}
      />

      {isLoading ? (
        <div style={{ padding: '0 16px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="dark"
              style={{ height: 74, borderRadius: 0, marginBottom: 1 }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            margin: '0 16px',
            background: CHART.PANEL,
            border: `1px solid ${CHART.BORDER}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {items.map((item) => (
            <FriendRoundRow
              key={
                item.last_round_score_id ??
                `${item.friend_passport_id}-${item.last_round_played_at}`
              }
              activity={item}
              variant={variantFor(item)}
              onClick={() => handleOpen(item)}
            />
          ))}
        </div>
      )}

      <RoundDetailSheet
        scoreId={sheetActivity?.last_round_score_id ?? null}
        profileUserId={sheetActivity?.friend_user_id ?? null}
        open={!!sheetActivity}
        onClose={() => setSheetActivity(null)}
        handicapDelta={
          sheetActivity?.is_counter &&
          sheetActivity.friend_handicap_index != null &&
          sheetActivity.handicap_index_at_time != null
            ? sheetActivity.friend_handicap_index - sheetActivity.handicap_index_at_time
            : null
        }
      />
    </section>
  );
};

export default RecentlyPlayedFeed;
