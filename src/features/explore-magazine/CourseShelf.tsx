import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreShelf } from './ExploreShelf';
import { ShelfShell } from './ExploreShells';
import type { CourseShelfRow } from './useCourseShelves';

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
/** #4ADE80 survives a bright course photograph; the darker band green does not. */
const GREEN = '#4ADE80';

export function CourseShelf({
  heading,
  rows,
  isFetched,
  kind,
  pos,
  metaLabel,
  seeAllLabel,
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
  seeAllLabel?: string | null;
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
            region={row.area}
            photo={TILE.h}
            figure={
              row.rank != null
                ? `#${row.rank}`
                : row.rating != null
                  ? row.rating.toFixed(1)
                  : null
            }
            unit={row.rank != null ? (row.rankScopeWorld ? 'world' : 'GB&I') : undefined}
            figureTone={row.rank == null && row.rating != null && row.rating >= 9 ? GREEN : undefined}
            whenLabel=""
            who=""
            isOwn={false}
            detail={sublineFor(row, t as never)}
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

/** area, then the sample the figure came from — never a figure with no basis.
 *  THE INTERPUNCT IS NEVER IN A STRING: the parts are localised, the joiner is
 *  not translatable. */
function sublineFor(
  row: CourseShelfRow,
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string,
): string {
  const parts: string[] = [];
  if (row.area) parts.push(row.area);
  if (row.ratingCount > 0) {
    parts.push(t('amateur.stream.ratingCount', '{{count}} ratings', { count: row.ratingCount }));
  } else if (row.rounds > 0) {
    parts.push(t('amateur.stream.roundCount', '{{count}} rounds', { count: row.rounds }));
  }
  return parts.join(' \u00B7 ');
}

export default CourseShelf;
