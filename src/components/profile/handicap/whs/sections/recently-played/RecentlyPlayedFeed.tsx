import React, { useState } from 'react';
import { useFriendsActivity } from '@/lib/whs/hooks';

import Paged8 from '../_shared/Paged8';
import FriendRoundCard from './FriendRoundCard';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import type { WhsFriendActivityWithImage, FriendLeaderboardEntry } from '@/lib/whs/types';
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';

interface Props {
  ownerUserId: string;
}

const INK_MUTE = 'var(--hcp-t-60)';

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
    // (auto-derives the UnsyncedPitchCard state from the snapshot).
    if (!item.friend_connection_id) {
      openFriendSheet({ targetUserId: item.friend_user_id, source: 'cinema_friend_card' });
      return;
    }
    // State B — Synced friend, but no detailed scorecard for this round
    // (EG summary-only). Never open the empty RoundDetailSheet.
    if (!item.last_round_score_id) {
      openFriendSheet({ targetUserId: item.friend_user_id, source: 'cinema_friend_card' });
      return;
    }
    // State A — Synced + has scorecard → real scorecard sheet
    setSheetActivity(item);
  };

  // Each item must satisfy { id: string } for Paged8
  const items = (data ?? []).map((d) => ({
    ...d,
    id: d.last_round_score_id ?? `${d.friend_passport_id}-${d.last_round_played_at}`,
  }));

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="Friends' Rounds"
        right={!isLoading && items.length > 0 ? 'Last fortnight' : undefined}
      />

      {isLoading ? (
        <div style={{ padding: '0 20px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 280,
                background: 'var(--hcp-bg-2)',
                borderRadius: 16,
                marginBottom: 12,
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p
          style={{
            padding: '0 20px',
            fontSize: 13,
            color: INK_MUTE,
            lineHeight: 1.5,
          }}
        >
          When your friends post rounds in MyEG, they'll show up here.
        </p>
      ) : (
        <Paged8
          items={items}
          ariaLabel="Friends' recent rounds"
          renderItem={(item) => (
            <FriendRoundCard activity={item} onClick={() => handleOpen(item)} />
          )}
        />
      )}

      <RoundDetailSheet
        scoreId={sheetActivity?.last_round_score_id ?? null}
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
