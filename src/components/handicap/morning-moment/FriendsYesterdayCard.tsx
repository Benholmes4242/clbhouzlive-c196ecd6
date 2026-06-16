/**
 * FriendsYesterdayCard — Cinema-language two-tier section. The ROUND OF THE DAY
 * hero (280px) sits above a horizontal scroll of 250×168 mini cards for the
 * remaining players. Tap-through navigates to the Friends sub-tab.
 */
import React from 'react';
import type { FriendYesterday, FriendsYesterdayResult } from '@/lib/handicap/useFriendsYesterday';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { FriendPostcard } from './friends-yesterday';
import RoundDetailSheet from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import type { WhsFriendActivityWithImage, FriendLeaderboardEntry } from '@/lib/whs/types';
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';

const toWhsOnlyEntry = (friend: FriendYesterday): FriendLeaderboardEntry => ({
  is_self: false,
  friend_user_id: null,
  friend_connection_id: friend.friend_connection_id,
  friend_passport_id: friend.friend_passport_id,
  friend_row_id: friend.last_round_score_id ?? null,
  friend_name: friend.name,
  friend_thumbnail_url: friend.thumbnail_url,
  friend_profile_photo_url: null,
  friend_handicap_index: friend.friend_handicap_index,
  friend_home_club: null,
  last_round_played_at: friend.played_at,
  last_round_course_name: friend.course_name,
  is_clbhouz_user: false,
  handicap_30d_ago: null,
  handicap_30d_delta: null,
  rounds_last_30d: 0,
});

const T = {
  ink: '#0F172A',
  ink55: 'rgba(15,23,42,0.55)',
  ink40: 'rgba(15,23,42,0.40)',
  ink10: 'rgba(15,23,42,0.10)',
  green: '#059669',
};
const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const EmptyState: React.FC<{ reason: string }> = ({ reason }) => {
  let copy = 'No friend rounds available.';
  if (reason === 'no_whs_friends') copy = 'No friends connected yet.';
  else if (reason === 'no_friends_played') copy = 'No friends played yesterday.';
  return (
    <div
      style={{
        padding: '14px 16px',
        background: '#fff',
        border: `0.5px solid ${T.ink10}`,
        borderRadius: 12,
        fontSize: 12,
        color: T.ink55,
        fontFamily: FONT,
        textAlign: 'center',
      }}
    >
      {copy}
    </div>
  );
};

interface Props {
  data: FriendsYesterdayResult;
  userId: string;
}

const toSheetActivity = (friend: FriendYesterday): WhsFriendActivityWithImage => ({
  friend_row_id:
    friend.last_round_score_id ??
    friend.user_id ??
    `${friend.friend_passport_id ?? 'friend'}-${friend.name}`,
  friend_passport_id: friend.friend_passport_id ?? 0,
  friend_name: friend.name,
  friend_thumbnail_url: friend.thumbnail_url,
  friend_profile_photo_url: null,
  friend_user_id: friend.user_id,
  friend_connection_id: friend.friend_connection_id,
  is_clbhouz_user: friend.is_clbhouz_user,
  last_round_played_at: friend.played_at,
  last_round_course_name: friend.course_name,
  last_round_adjusted_gross: friend.score,
  last_round_stableford: friend.stableford,
  last_round_differential: friend.differential,
  last_round_score_id: friend.last_round_score_id,
  course_thumbnail_image: friend.course_thumbnail_image,
  is_course_best: false,
  friend_handicap_index: friend.friend_handicap_index,
  is_counter: friend.is_counter,
  handicap_index_at_time: friend.handicap_index_at_time,
  viewer_has_reacted: false,
  reaction_count: 0,
});

const FriendsYesterdayCard: React.FC<Props> = ({ data, userId }) => {
  const { friends, count, absenceReason } = data;
  const [sheetActivity, setSheetActivity] = React.useState<WhsFriendActivityWithImage | null>(null);
  const { open: openFriendSheet } = useOpenFriendSheet();

  const handleTap = (friend: FriendYesterday) => {
    analyticsEvents.track('morning_moment_friends_tapped', {
      user_id: userId,
      friends_count: count,
      score_id: friend.last_round_score_id,
    });
    // Non-synced (WHS-only) friends → open unified FriendSheet pitch card.
    if (!friend.is_clbhouz_user || !friend.user_id) {
      openFriendSheet({ whsOnlyEntry: toWhsOnlyEntry(friend), source: 'morning_moment' });
      return;
    }
    setSheetActivity(toSheetActivity(friend));
  };

  if (absenceReason && friends.length === 0) {
    return <EmptyState reason={absenceReason} />;
  }
  if (friends.length === 0) return null;

  // Lowest gross identifies the LOWEST-chip recipient (only when 2+ friends played).
  const lowestId =
    friends.length > 1
      ? friends.reduce((lo, f) => (f.score < lo.score ? f : lo), friends[0]).last_round_score_id
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Section eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: T.green,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(248,250,252,0.65)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          FRIENDS YESTERDAY · {count} PLAYED
        </span>
      </div>

      <div
        className="fyc-scroll"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '0 0 6px',
          scrollPaddingLeft: 16,
          scrollPaddingRight: 16,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`.fyc-scroll::-webkit-scrollbar{display:none}`}</style>
        {friends.map((f, i) => (
          <FriendPostcard
            key={`${f.user_id ?? f.friend_passport_id ?? 'x'}-${i}`}
            friend={f}
            showLowest={
              !!lowestId &&
              f.last_round_score_id != null &&
              f.last_round_score_id === lowestId
            }
            onClick={() => handleTap(f)}
          />
        ))}
      </div>

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
    </div>
  );
};

export default FriendsYesterdayCard;
