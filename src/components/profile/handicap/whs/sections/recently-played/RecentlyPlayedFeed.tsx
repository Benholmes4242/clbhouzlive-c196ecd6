/**
 * RecentlyPlayedFeed - friends' rounds, as rows.
 *
 * No card per row, no rule between rows, no paged carousel: one house row per
 * round with fixed figure columns. The rows sit inside a single panel so the
 * section still reads as one object.
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
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';

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
  const { data, isLoading } = useFriendsActivity(ownerUserId);
  const [sheetActivity, setSheetActivity] =
    useState<WhsFriendActivityWithImage | null>(null);
  const { open: openFriendSheet } = useOpenFriendSheet();

  const handleOpen = (item: WhsFriendActivityWithImage) => {
    // State D — Not a Clbhouz user (or unresolvable user_id) → invite-to-join sheet
    if (!item.is_clbhouz_user || !item.friend_user_id) {
      openFriendSheet({ whsOnlyEntry: toWhsOnlyEntry(item), source: 'cinema_friend_card' });
      return;
    }
    // State C — Clbhouz user but not synced (no friend_connection_id) → friend sheet
    if (!item.friend_connection_id) {
      openFriendSheet({ targetUserId: item.friend_user_id, source: 'cinema_friend_card' });
      return;
    }
    // State B — Synced friend, but no detailed scorecard for this round
    if (!item.last_round_score_id) {
      openFriendSheet({ targetUserId: item.friend_user_id, source: 'cinema_friend_card' });
      return;
    }
    // State A — Synced + has scorecard → real scorecard sheet
    setSheetActivity(item);
  };

  const items = data ?? [];

  // Nothing at all when the fortnight is empty.
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
              style={{ height: 58, borderRadius: 0, marginBottom: 1 }}
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
