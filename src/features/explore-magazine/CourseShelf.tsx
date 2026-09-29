import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreShelf } from './ExploreShelf';
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';

import type { ListEvent } from './listCourseEvents';
import { ShelfShell } from './ExploreShells';
import type { CourseShelfRow } from './useCourseShelves';
import { ratingPrintable } from './courseRatingFloor';
import { RankFlagBadge } from './RankFlagBadge';

/**
 * THE COURSE RAIL (BRIEF_EXPLORE_MAGAZINE PHASE C §3a-§3c) — kind: courses.
 *
 * ONE FIXED TILE SIZE, 180x118, for every course shelf: county, world and list
 * are siblings by construction, not by discipline.
 *
 * ONE FIGURE PER TILE. A Top 100 course wears its RANK CHIP; anything else
 * wears its RATING, green at 9.0 and above. Never both, and never an invented
 * figure — a course with neither renders no chip at all.
 */

const TILE = { w: 180, h: 118 };

export function CourseShelf({
  heading,
  rows,
  isFetched,
  kind,
  pos,
  metaLabel,
  sub,
  seeAllLabel,
  events,
  onSeeAll,
  onDepart,
}: {
  heading: string;
  rows: CourseShelfRow[];
  isFetched: boolean;
  /** Analytics sub-kind, e.g. 'courses:county'. */
  kind: string;
  pos: number;
  metaLabel?: string | null;
  /** The rail's BASIS, one line under the heading (BRIEF_COURSES_MERGED §4). */
  sub?: string | null;
  seeAllLabel?: string | null;
  /** §5a course_id -> its strongest recent event. Absent or null = the area,
   *  which is the CORRECT line when the page holds no event or holds a tie. */
  events?: Map<string, ListEvent | null>;
  onSeeAll?: () => void;
  onDepart: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('courses');

  if (!isFetched) return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  /* AN EMPTY SHELF RENDERS NOTHING — no heading over nothing (§3e). */
  if (rows.length === 0) return null;

  return (
    <ExploreShelf
      heading={heading}
      metaLabel={metaLabel ?? null}
      sub={sub ?? null}
      seeAllLabel={seeAllLabel ?? null}
      onSeeAll={onSeeAll}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind, pos })}
    >
      {rows.map((row) => (
        <div key={row.courseId} style={{ flex: `0 0 ${TILE.w}px`, width: TILE.w }}>
          <StandoutTile
            courseId={row.courseId}
            courseName={row.name}
            imageUrl={row.imageUrl}
            region={null}
            photo={TILE.h}
              reserveTwoLines
            figureNode={row.rank != null ? <RankFlagBadge rank={row.rank} scope={row.rankScope ?? null} /> : undefined}
            figure={row.rank != null ? null : ratingPrintable(row.rating, row.ratingCount) ? row.rating.toFixed(1) : null}
            /* Neutral keeps the component's white default over photography. */
            figureTone={row.rank == null && ratingPrintable(row.rating, row.ratingCount) && row.rating >= 9 ? courseSubScoreTone(row.rating) : undefined}
            whenLabel=""
            who=""
            isOwn={false}
            detail={sublineFor(row, t as never, events?.get(row.courseId) ?? null)}
            onPress={() => {
              analyticsEvents.track('amateur_shelf_tile_tapped', { kind, pos });
              onDepart();
              navigate(`/courses/${row.courseId}`);
            }}
          />
        </div>
      ))}
    </ExploreShelf>
  );
}

/** §5a THE RECENT EVENT WHERE THERE IS ONE, else area, then the sample the
 *  figure came from — never a figure with no basis, and never an event that did
 *  not happen (a tie between kinds arrives here as null and takes the area).
 *  THE INTERPUNCT IS NEVER IN A STRING: the parts are localised, the joiner is
 *  not translatable. */
function sublineFor(
  row: CourseShelfRow,
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string,
  event: ListEvent | null,
): string {
  const parts: string[] = [];
  if (event) {
    if (event.kind === 'record') {
      parts.push(t('amateur.stream.list.eventRecord', 'New course record'));
    } else if (event.kind === 'low' && event.gross != null) {
      parts.push(t('amateur.stream.list.eventLow', 'New low of {{gross}}', { gross: event.gross }));
    } else if (event.kind === 'rating' && event.rating != null) {
      parts.push(t('amateur.stream.list.eventRating', 'Newly rated {{rating}}', { rating: event.rating.toFixed(1) }));
    }
  }
  if (row.area) parts.push(row.area);
  return parts.join(' \u00B7 ');
}

export default CourseShelf;
