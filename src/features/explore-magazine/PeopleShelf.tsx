import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { rememberAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { r } from '@/lib/radius';

import { ExploreShelf } from './ExploreShelf';
import { ShelfShell } from './ExploreShells';
import { useClubGolfers, type ClubGolfer } from './useClubGolfers';

/**
 * GOLFERS AT {CLUB} (BRIEF_EXPLORE_MAGAZINE PHASE C §4).
 *
 * Membership is a resolved club UUID (see useClubGolfers) — never home_club
 * free text. NO CLUB, OR NO CLUBMATES, AND THE SHELF DOES NOT RENDER: the next
 * shelf takes the slot and there is never a "no golfers" placeholder.
 */

const TILE = { w: 132, h: 148 };

export function PeopleShelf({
  viewerId,
  clubId,
  clubName,
  enabled,
  pos,
}: {
  viewerId: string | undefined;
  clubId: string | null;
  clubName: string | null;
  enabled: boolean;
  pos: number;
}) {
  const { t } = useTranslation('courses');
  const { golfers, isFetched } = useClubGolfers(viewerId, clubId, enabled);

  if (!enabled || !clubId) return null;
  if (!isFetched) return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  if (golfers.length === 0) return null;

  return (
    <ExploreShelf
      heading={t('amateur.shelf.golfersAtClub', 'Golfers at {{club}}', {
        club: clubName ?? t('amateur.shelf.yourClub', 'your club'),
      })}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'people', pos })}
    >
      {golfers.map((golfer) => (
        <PersonTile key={golfer.userId} golfer={golfer} pos={pos} />
      ))}
    </ExploreShelf>
  );
}

function PersonTile({ golfer, pos }: { golfer: ClubGolfer; pos: number }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? user?.id;

  /* THE CANONICAL FOLLOW STATE AND MUTATION. There is NO local follow flag here:
     useFollowState reads the ['follow-status'] cache (seeding it from the
     database on mount), so a member the viewer already follows reads "Following"
     from the first render, and useToggleFollow patches that same cache
     optimistically and rolls back on failure. */
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: golfer.userId,
    viewerActorType,
    viewerActorId,
  });
  const following = cached ?? false;

  const openProfile = (event: React.MouseEvent) => {
    /* THE TILE HAS TWO TARGETS. Stopping propagation here is what keeps a tap on
       the name or the avatar from also reaching the Follow pill. */
    event.stopPropagation();
    analyticsEvents.track('amateur_shelf_tile_tapped', { kind: 'people', pos });
    rememberAmateurScroll();
    navigate(golfer.username ? `/u/${golfer.username}` : `/profile/${golfer.userId}`);
  };

  const onFollow = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user?.id || !viewerActorId || toggle.isPending) return;
    analyticsEvents.track('amateur_follow_tapped', { from: 'people_shelf', pos });
    toggle.mutate({
      targetActorType: 'personal',
      targetActorId: golfer.userId,
      targetUserId: golfer.userId,
      viewerActorType,
      viewerActorId,
      viewerUserId: user.id,
      isFollowing: following,
    });
  };

  return (
    <div
      style={{
        flex: `0 0 ${TILE.w}px`,
        width: TILE.w,
        minWidth: 0,
        height: TILE.h,
        borderRadius: r('lg'),
        border: `1px solid ${A.HAIR}`,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: SANS,
        overflow: 'hidden',
      }}
    >
      <span onClick={openProfile} style={{ cursor: 'pointer' }}>
        <SquircleAvatar size={44} src={golfer.photoUrl} alt={golfer.name} userId={golfer.userId} thinRing />
      </span>
      <span
        onClick={openProfile}
        style={{
          maxWidth: '100%',
          minWidth: 0,
          color: A.INK,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'pointer',
        }}
      >
        {golfer.name}
      </span>
      {/* §3 THE REASON, IN PRECEDENCE ORDER, OR NOTHING. Nothing is invented: a
          member with no boards, no rounds here and no recent join shows the
          name alone. */}
      <span
        style={{
          maxWidth: '100%',
          minWidth: 0,
          color: A.MUTE,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {golfer.boards > 0
          ? t('amateur.shelf.holdsBoards', 'Holds {{count}} boards', { count: golfer.boards })
          : golfer.roundsHere > 0
            ? t('amateur.shelf.roundsHere', '{{count}} rounds here', { count: golfer.roundsHere })
            : golfer.isNew
              ? t('amateur.shelf.newThisMonth', 'New this month')
              : ''}
      </span>
      <button
        type="button"
        onClick={onFollow}
        style={{
          marginTop: 'auto',
          width: '100%',
          border: following ? 0 : `1px solid ${A.HAIR}`,
          background: following ? A.INK_SOFT ?? 'rgba(255,255,255,0.10)' : 'transparent',
          color: A.INK,
          borderRadius: 999,
          padding: '6px 0',
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {following ? t('amateur.shelf.following', 'Following') : t('amateur.shelf.follow', 'Follow')}
      </button>
    </div>
  );
}

export default PeopleShelf;
