import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { countByCourse } from './useCommunityRails';

/**
 * COURSE INDEX — every course with member media, grouped by region.
 *
 * This is the page's DIRECTORY, not another media surface: rows are text and a
 * count. Discover is course-led, so the honest answer to "where has everyone
 * been" is a list of clubs, not more tiles.
 *
 * REGION GROUPING uses golf_courses.sub_country as carried on the moment.
 * Courses with no region fall into a single trailing "Elsewhere" group rather
 * than being dropped — a missing region is a data gap, not a reason to hide a
 * club that members have posted from.
 *
 * ROWS ARE HAIRLINE-SEPARATED, never carded (Dispatch): a card per club would
 * turn 57 clubs into 57 boxes.
 */

const HAIR = '#EDF0F3';
const INK = '#0E1216';
const DIM = '#A2A9B2';

interface Props {
  moments: Moment[];
  /** Label for courses whose region is unknown. */
  elsewhereLabel: string;
  countLabel: (n: number) => string;
}

interface CourseRow {
  courseId: string;
  name: string;
  count: number;
}

export function CommunityCourseIndex({ moments, elsewhereLabel, countLabel }: Props) {
  const navigate = useNavigate();

  const groups = useMemo(() => {
    const counts = countByCourse(moments);
    const nameById = new Map<string, string>();
    const regionById = new Map<string, string | null>();
    for (const m of moments) {
      if (m.courseName) nameById.set(m.courseId, m.courseName);
      regionById.set(m.courseId, m.region ?? null);
    }

    const byRegion = new Map<string, CourseRow[]>();
    for (const [courseId, count] of counts) {
      const name = nameById.get(courseId);
      // No name = nothing to render in a text directory.
      if (!name) continue;
      const region = regionById.get(courseId) || '';
      const list = byRegion.get(region) ?? [];
      list.push({ courseId, name, count });
      byRegion.set(region, list);
    }

    const out = [...byRegion.entries()].map(([region, rows]) => ({
      region,
      // Busiest club first inside a region; name breaks the tie so the order is
      // stable between renders.
      rows: rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    }));

    // Named regions by size, then the unknown group LAST regardless of size.
    return out.sort((a, b) => {
      if (!a.region) return 1;
      if (!b.region) return -1;
      return b.rows.length - a.rows.length || a.region.localeCompare(b.region);
    });
  }, [moments]);

  if (groups.length === 0) return null;

  return (
    <div>
      {groups.map((g) => (
        <div key={g.region || '__elsewhere'} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: DIM,
              padding: '0 16px 6px',
            }}
          >
            {g.region || elsewhereLabel}
          </div>

          {g.rows.map((r) => (
            <button
              key={r.courseId}
              type="button"
              onClick={() => navigate(`/courses/${r.courseId}?tab=media`)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderTop: `0.5px solid ${HAIR}`,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.01em',
                }}
              >
                {r.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: DIM,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {countLabel(r.count)}
              </span>
              <ChevronRight size={14} color={DIM} strokeWidth={2} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default CommunityCourseIndex;
