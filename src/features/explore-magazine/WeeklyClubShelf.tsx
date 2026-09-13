import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';

import { ExploreShelf } from './ExploreShelf';
import { ShelfShell } from './ExploreShells';
import { relativeDay, toParLabel } from './exploreCopy';
import { useClubWeekRounds } from './useClubWeekRounds';

const TILE = { w: 206, h: 118 };

/**
 * Reusable weekly home-club rail for Scores and the stream shelf slot.
 *
 * THE SCOPE IS THE CLUB'S COURSES, NOT ITS MEMBERS. p_scope='club' in the
 * deployed board_pool filters by primary_club_id (members anywhere), which is
 * why a Cherry Lodge round appeared under "This week at Sundridge Park". The
 * rounds now come from one course-scoped read per course of the club — see
 * useClubWeekRounds. The members-anywhere set stays with the People shelf.
 */
export function WeeklyClubShelf({
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
  const navigate = useNavigate();
  const opener = useScorecardOpener();
  const board = useClubWeekRounds(viewerId, clubId, clubName, enabled && !!viewerId, 12);
  const rows = board.rows;
  const courseIds = useMemo(() => rows.map((row) => row.course_id).filter((id): id is string => !!id), [rows]);
  const meta = useCourseCardMeta(courseIds);

  if (enabled && (!board.isFetched || (courseIds.length > 0 && !meta.isFetched))) {
    return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  }
  if (!enabled || !clubId || !clubName || board.error || rows.length === 0) return null;

  return (
    <ExploreShelf
      heading={t('amateur.stream.shelf.clubWeek', 'This week at {{club}}', { club: clubName })}
      /* The count is the sum of the per-course pools: rounds at this club's
         courses inside the window — the same set the tiles are drawn from. */
      metaLabel={t('amateur.stream.roundCount', '{{count}} rounds', { count: board.poolRounds })}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'club_week', pos })}
    >
      {rows.map((row) => {
        const course = row.course_id ? meta.data?.get(row.course_id) : null;
        const toPar = row.gross_score != null && row.course_par != null ? row.gross_score - row.course_par : null;
        const who = row.user_id === viewerId ? t('amateur.stream.you', 'You') : row.display_name ?? t('amateur.stream.aMember', 'A member');
        return (
          <div key={`${row.whs_score_id ?? row.user_id}:${row.play_date}`} style={{ flex: `0 0 ${TILE.w}px`, width: TILE.w }}>
            <StandoutTile
              courseId={row.course_id ?? ''}
              /* EVERY TILE IS THE SAME CLUB, so the player leads and the course
                 is named only where the club holds more than one (East vs West
                 distinguishes; repeating the club name on every tile does not). */
              courseName={row.course_label ?? ''}
              imageUrl={course?.imageUrl ?? null}
              region={null}
              photo={TILE.h}
              reserveTwoLines
              figure={row.gross_score != null ? String(row.gross_score) : null}
              unit={toParLabel(toPar) ?? undefined}
              whenLabel={relativeDay(row.play_date) ?? ''}
              who={who}
              /* IDENTITY IS user_profiles AND NOTHING ELSE. get_board_page
                 already joins user_profiles for display_name and
                 profile_photo_url; the shelf simply never threaded the photo
                 through, so every tile fell back to initials. Never
                 whs_friends / whs_friend_matches: those hold England Golf
                 names and photo URLs and leaked once already. A null photo
                 keeps the deterministic initials gradient. */
              avatarUrl={row.profile_photo_url ?? null}
              avatarUserId={row.user_id}
              isOwn={row.user_id === viewerId}

              onPress={() => {
                analyticsEvents.track('amateur_shelf_tile_tapped', { kind: 'club_week', pos });
                if (row.whs_score_id) opener.openByScore(row.whs_score_id, null, row.user_id);
                else if (row.course_id) navigate(`/courses/${row.course_id}?tab=champions`);
              }}
            />
          </div>
        );
      })}
    </ExploreShelf>
  );
}
