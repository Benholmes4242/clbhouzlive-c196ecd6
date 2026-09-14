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

import { ExploreShelf } from './ExploreShelf';
import { ShelfShell } from './ExploreShells';
import { useClubGolfers, type ClubGolfer } from './useClubGolfers';
import {
  assignClubRecordCategories,
  type ClubRecordCategory,
} from './clubGolferRecords';
/* THE ONE SUGGESTION ENGINE. public.get_suggested_golfers, SECURITY DEFINER,
   already excludes the viewer, everyone they follow, blocked actors, test and
   deleted profiles, and drops any candidate whose reason resolves to NULL
   (WHERE r.reason IS NOT NULL) - so a reasonless person cannot reach this shelf
   and nothing has to be recomputed on the client. Its precedence is club,
   reciprocal, course, clubmate_mutual, mutual, active, recently_joined: a
   superset of the shelf's club-then-rounds-then-shared-course order, with the
   same three in the same relative order, so there is no conflict to report.
   src/features/explore-magazine/useSuggestedGolfers.ts is now DEAD-LISTED. */
import {
  useSuggestedGolfers,
  type SuggestedGolfer,
} from '@/features/social-suggestions/useSuggestedGolfers';
import { reasonText } from '@/features/social-suggestions/SuggestedGolferRow';

/**
 * GOLFERS AT {CLUB} (BRIEF_EXPLORE_MAGAZINE PHASE C §4).
 *
 * Membership is a resolved club UUID (see useClubGolfers) — never home_club
 * free text. NO CLUB, OR NO CLUBMATES, AND THE SHELF DOES NOT RENDER: the next
 * shelf takes the slot and there is never a "no golfers" placeholder.
 */

/* The caption rows reserve their full line boxes. The extra six pixels keep
   descenders, the reason line and the Follow control clear at narrow widths;
   one shared height keeps both club and suggested rails uniform. */
const TILE = { w: 132, h: 154 };
/** How many suggestions a rail can hold before it stops being a rail. */
const RENDERED = 12;

export function PeopleShelf({
  viewerId,
  clubId,
  clubName,
  enabled,
  pos,
  source = 'club',
}: {
  viewerId: string | undefined;
  clubId: string | null;
  clubName: string | null;
  enabled: boolean;
  pos: number;
  /** ADDITIVE, DEFAULTED: omit it and this is the club shelf, unchanged. */
  source?: 'club' | 'suggested';
}) {
  const { t } = useTranslation('courses');
  /* THE REASON COPY LIVES WITH THE ENGINE, in the common namespace, so the shelf
     says the same sentence as the rows on /golferstofollow. */
  const { t: tc } = useTranslation('common');
  const suggested = source === 'suggested';
  const club = useClubGolfers(viewerId, clubId, enabled && !suggested);
  const people = useSuggestedGolfers(RENDERED, enabled && suggested);

  /* ONE ANALYTICS KIND PER SOURCE, so the conversion question — does the
     suggestion shelf actually produce follows? — has an answer. */
  const kind = suggested ? 'suggested_golfers' : 'people';
  const clubAssignments = assignClubRecordCategories(club.golfers);
  const rows: ShelfPerson[] = suggested
    ? ((people.data ?? []) as SuggestedGolfer[]).map((g) => ({
        userId: g.user_id,
        name: (g.display_name || g.username || '').trim(),
        username: g.username,
        photoUrl: g.profile_photo_url,
        /* THE SERVER'S REASON, VERBATIM. Not recomputed here: the engine decided
           the precedence and only returns people who have one. */
        reason: reasonText(g, tc as unknown as (k: string, o?: Record<string, unknown>) => string),
      }))
    : club.golfers.map((g) => ({
        userId: g.userId,
        name: g.name,
        username: g.username,
        photoUrl: g.photoUrl,
        reason: reasonForClubGolfer(
          g,
           clubAssignments.get(g.userId) ?? null,
          t as unknown as (key: string, fallback?: string, vars?: Record<string, unknown>) => string,
        ),
      }));
  const isFetched = suggested ? people.isFetched : club.isFetched;

  if (!enabled) return null;
  if (!suggested && !clubId) return null;
  if (!isFetched) {
    return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  }
  /* §5 NOBODY TO SUGGEST, NO SHELF. No placeholder, no apology. */
  if (rows.length === 0) return null;

  return (
    <ExploreShelf
        heading={
          suggested
            ? t('amateur.shelf.golfersToFollow', 'Golfers to follow')
            : t('amateur.shelf.golfersAtClub', 'Golfers at {{club}}', {
                club: clubName ?? t('amateur.shelf.yourClub', 'your club'),
              })
        }
        onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind, pos })}
      >
        {rows.map((person) => (
          <PersonTile key={person.userId} golfer={person} pos={pos} kind={kind} />
        ))}
    </ExploreShelf>
  );
}

interface ShelfPerson {
  userId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  /** Already localised at the source, or '' where none resolved. */
  reason: string;
}

/* §3 THE CLUB REASON, IN PRECEDENCE ORDER, OR NOTHING. Unchanged wording and
   unchanged precedence — lifted out of the tile only so one tile can serve two
   sources. */
function reasonForClubGolfer(
  golfer: ClubGolfer,
  category: ClubRecordCategory | null,
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string,
): string {
  if (category) return clubRecordReason(category, t);
  if (golfer.roundsHere > 0) {
    return t('amateur.shelf.roundsHere', '{{count}} round here', { count: golfer.roundsHere });
  }
  if (golfer.isNew) return t('amateur.shelf.newThisMonth', 'New this month');
  return '';
}

function clubRecordReason(
  category: ClubRecordCategory,
  t: (key: string, fallback?: string) => string,
): string {
  const labels: Record<ClubRecordCategory, [string, string]> = {
    lowest_gross_all_time: ['courseRecordHolder', 'Course record holder'],
    lowest_gross_women_all_time: ['womensCourseRecordHolder', "Women's course record holder"],
    most_birdies_all_time: ['allTimeBirdieLeader', 'All-time birdie leader'],
    most_eagles_all_time: ['allTimeEagleLeader', 'All-time eagle leader'],
    most_aces_all_time: ['allTimeAceLeader', 'All-time ace leader'],
    best_stableford_all_time: ['allTimeStablefordLeader', 'All-time stableford leader'],
    most_albatrosses_all_time: ['allTimeAlbatrossHolder', 'All-time albatross holder'],
    most_rounds_all_time: ['mostRoundsHere', 'Most rounds here'],
    best_score_diff_all_time: ['bestScoreToParHere', 'Best score-to-par here'],
  };
  const [key, fallback] = labels[category];
  return t(`amateur.shelf.recordReason.${key}`, fallback);
}

function PersonTile({ golfer, pos, kind }: { golfer: ShelfPerson; pos: number; kind: string }) {
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
    analyticsEvents.track('amateur_shelf_tile_tapped', { kind, pos });
    rememberAmateurScroll();
    /* THE PROFILE ROUTE, the same username-or-id form the search surfaces use.
       NOT the scorecard opener the round cards use: that resolver deliberately
       sends a tap to compare/nudge, and the brief asks for the profile. */
    navigate(`/profile/${golfer.username ?? golfer.userId}`);
  };

  const onFollow = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user?.id || !viewerActorId || toggle.isPending) return;
    analyticsEvents.track('amateur_follow_tapped', { from: kind === 'suggested_golfers' ? 'suggested_golfers' : 'people_shelf', pos });
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
        borderRadius: 14,
        border: `1px solid ${A.HAIRLINE}`,
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
          lineHeight: '18px',
          height: 18,
          flexShrink: 0,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'pointer',
        }}
      >
        {golfer.name}
      </span>
      {/* §3 THE REASON, RESOLVED AT THE SOURCE, OR NOTHING. Nothing is
          invented: a member no line applies to shows the name alone. */}
      <span
        style={{
          maxWidth: '100%',
          minWidth: 0,
          color: A.MUTE,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: '16px',
          height: 16,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {golfer.reason}
      </span>
      <button
        type="button"
        onClick={onFollow}
        style={{
          marginTop: 'auto',
          width: '100%',
          border: following ? 0 : `1px solid ${A.HAIRLINE}`,
          background: following ? 'rgba(255,255,255,0.10)' : 'transparent',
          color: A.INK,
          borderRadius: 999,
          padding: '6px 0',
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: '16px',
          minHeight: 30,
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        {following ? t('amateur.shelf.following', 'Following') : t('amateur.shelf.follow', 'Follow')}
      </button>
    </div>
  );
}

export default PeopleShelf;
