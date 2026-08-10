/**
 * CircleView - the merged Circle tab.
 *
 * Composition, in order:
 *   1. ONE leaderboard (FriendsLeaderboardSection)
 *   2. Compare - a panel showing three recent people, each opening the sheet
 *   3. Invite - three friends not on clbhouz, plus the wide door to the sheet
 *   4. Friends' rounds
 *
 * BRIEF_CIRCLE_INVITE_ENTRY moved invite ABOVE friends' rounds: the two
 * ACTIONS sit in the reachable zone and the endless list goes last, which is
 * where a feed belongs - a member scrolls into it and keeps going. Nothing
 * beneath a feed is reached.

 *
 * THE ORDERING PRINCIPLE: order by the question the previous section leaves
 * open. The leaderboard ends on "I'm 6th of 25" and compare answers it. A feed
 * leaves no question open, so nothing follows Friends' rounds - which is why
 * compare no longer sits beneath it, structurally unreachable.
 *
 * The Rivalries section and the Course Champions section are GONE, not hidden.
 * Rivalries required the member to manage a fixed set of slots to get one
 * comparison; the compare sheet gives the same comparison against anyone they
 * can search, with no slots to manage. Course Champions aggregated per-course
 * boards that the course detail page already shows better - its two figures
 * that were NOT visible elsewhere (titles held, the nearest chase) moved to the
 * Achievements panel on Today.
 *
 * FRIEND VIEW - explicit, do not re-derive from "owner-only":
 *   SHOWN:      nothing on this tab besides the compare entry, which is
 *               pre-selected on the owner by the header control instead.
 *   SUPPRESSED: the leaderboard, friends' rounds, invite.
 * In friend view the tab therefore carries the compare entry only, which is a
 * real destination rather than an empty tab.
 */
import React from 'react';
import FriendsLeaderboardSection from '../sections/friends-leaderboard-v2/FriendsLeaderboardSection';
import RecentlyPlayedFeed from '../sections/recently-played/RecentlyPlayedFeed';
import CompareEntryPanel from '../sections/compare/CompareEntryPanel';
import CircleInviteAction from '../sections/invite-to-clbhouz/CircleInviteAction';

interface Props {
  userId: string;
  readOnly?: boolean;
  /** First name of the profile owner - used in friend view for self-cell labels. */
  ownerFirstName?: string | null;
}

export const CircleView: React.FC<Props> = ({
  userId,
  readOnly = false,
  ownerFirstName = null,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-circle"
      aria-labelledby="handicap-tab-circle"
      className="[&>section:first-child]:!mt-0 [&>section:first-child>div:first-child]:!pt-0"
      style={{ paddingTop: 32 }}
    >
      {/* 1. The one leaderboard - owner only */}
      {!readOnly && (
        <FriendsLeaderboardSection
          userId={userId}
          viewMode="owner"
          ownerFirstName={ownerFirstName}
        />
      )}

      {/* 2. Compare - shown in friend view, where it carries no rows */}
      <CompareEntryPanel viewerUserId={userId} readOnly={readOnly} />

      {/* 3. Friends' rounds - owner only */}
      {!readOnly && <RecentlyPlayedFeed ownerUserId={userId} />}

      {/* 4. Invite - owner only. One canonical surface: the action opens
          InviteFriendsSheet via the app-wide provider. */}
      {!readOnly && <CircleInviteAction />}
    </div>
  );
};

export default CircleView;
