import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import {
  usePersonalBests,
  type PersonalBestRow,
} from '@/components/explore-tab-new/courseled/hooks/usePersonalBests';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreShelf } from './ExploreShelf';
import { ShelfRetry, ShelfShell } from './ExploreShells';
import { relativeDay } from './exploreCopy';

/** Eight is the settled discovery rail size. The RPC performs every dedup and
 * graduated-widening pass; the client preserves its order and only takes the
 * first page. */
export const PERSONAL_BESTS_TILE_LIMIT = 8;
const TILE = { w: 206, h: 118 };

export function personalBestTiles(rows: PersonalBestRow[]): PersonalBestRow[] {
  return rows.slice(0, PERSONAL_BESTS_TILE_LIMIT);
}

export function PersonalBestsShelf({
  viewerId,
  pos,
}: {
  viewerId: string | undefined;
  pos: number;
}) {
  const { t } = useTranslation('courses');
  const query = usePersonalBests(viewerId);
  const opener = useScorecardOpener();
  const rows = useMemo(() => personalBestTiles(query.data ?? []), [query.data]);
  const courseIds = useMemo(
    () => rows.map((row) => row.course_id).filter((id): id is string => !!id),
    [rows],
  );
  const meta = useCourseCardMeta(courseIds);

  if (!viewerId) return null;
  if (!query.isFetched) return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  if (query.isError) {
    return (
      <ShelfRetry
        heading={t('discover.personalBests', 'Personal bests')}
        label={t('amateur.stream.failed', 'This did not load.')}
        action={t('amateur.stream.retry', 'Try again')}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (rows.length === 0) return null;
  if (!meta.isFetched) return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;

  return (
    <>
      <ExploreShelf
        heading={t('discover.personalBests', 'Personal bests')}
        metaLabel={t('discover.last90', 'Last 90 days')}
        onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'personal_bests', pos })}
      >
        {rows.map((row) => {
          const course = meta.data?.get(row.course_id);
          return (
            <div
              key={`${row.whs_score_id}:${row.feat_kind}`}
              data-personal-best-tile={row.feat_kind}
              style={{ flex: `0 0 ${TILE.w}px`, width: TILE.w }}
            >
              <StandoutTile
                courseId={row.course_id}
                courseName={course?.name ?? row.course_name ?? t('discover.unknownCourse', 'Course')}
                imageUrl={course?.imageUrl ?? null}
                region={course?.region ?? row.region ?? null}
                photo={TILE.h}
                figure={row.figure}
                unit={row.figure_unit ?? undefined}
                whenLabel={relativeDay(row.play_date) ?? ''}
                who={row.is_self ? t('discover.wire.you', 'You') : (row.display_name?.trim() ?? '')}
                isOwn={row.is_self}
                avatarUrl={row.profile_photo_url}
                avatarUserId={row.user_id}
                detail={row.headline ?? ''}
                subline={row.reference_line}
                reserveTwoLines
                onPress={() => {
                  analyticsEvents.track('amateur_shelf_tile_tapped', {
                    kind: 'personal_bests',
                    pos,
                    feat: row.feat_kind,
                  });
                  opener.openByScore(row.whs_score_id, null, row.user_id);
                }}
              />
            </div>
          );
        })}
      </ExploreShelf>

      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </>
  );
}

export default PersonalBestsShelf;