import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { useBoardPage } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';

import { ExploreShelf } from './ExploreShelf';
import { ShelfShell } from './ExploreShells';
import { relativeDay, toParLabel } from './exploreCopy';

const TILE = { w: 206, h: 118 };

/** Reusable weekly home-club rail for Scores now and Phase C later. */
export function WeeklyClubShelf({
  viewerId,
  clubName,
  enabled,
  pos,
}: {
  viewerId: string | undefined;
  clubName: string | null;
  enabled: boolean;
  pos: number;
}) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const opener = useScorecardOpener();
  const filters = useMemo(() => ({ ...DEFAULT_FILTERS, scope: 'club' as const, window: '14' as const }), []);
  const board = useBoardPage(viewerId, 'recent', filters, { limit: 12, enabled: enabled && !!viewerId });
  const rows = board.data?.rows ?? [];
  const courseIds = useMemo(() => rows.map((row) => row.course_id).filter((id): id is string => !!id), [rows]);
  const meta = useCourseCardMeta(courseIds);

  if (enabled && (!board.isFetched || (courseIds.length > 0 && !meta.isFetched))) {
    return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  }
  if (!enabled || !clubName || board.error || rows.length === 0) return null;

  return (
    <ExploreShelf
      heading={t('amateur.stream.shelf.clubWeek', 'This week at {{club}}', { club: clubName })}
      metaLabel={t('amateur.stream.roundCount', '{{count}} rounds', { count: board.data?.pool.rounds ?? 0 })}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'club_week', pos })}
    >
      {rows.map((row) => {
        const course = row.course_id ? meta.data?.get(row.course_id) : null;
        const toPar = row.gross_score != null && row.course_par != null ? row.gross_score - row.course_par : null;
        return (
          <div key={`${row.whs_score_id ?? row.user_id}:${row.play_date}`} style={{ flex: `0 0 ${TILE.w}px`, width: TILE.w }}>
            <StandoutTile
              courseId={row.course_id ?? ''}
              courseName={row.course_name}
              imageUrl={course?.imageUrl ?? null}
              region={course?.region ?? course?.subCountry ?? null}
              photo={TILE.h}
              figure={row.gross_score != null ? String(row.gross_score) : null}
              unit={toParLabel(toPar) ?? undefined}
              whenLabel={relativeDay(row.play_date) ?? ''}
              who={row.user_id === viewerId ? t('amateur.stream.you', 'You') : row.display_name ?? t('amateur.stream.aMember', 'A member')}
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