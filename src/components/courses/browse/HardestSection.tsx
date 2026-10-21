import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { useStatBrowseList, type StatBrowseRow } from '../useStatBrowse';
import { useSectionReady } from './PageLoadGate';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { fmtToPar } from './format';
import { HardestShell } from './sectionShells';

/* Tile geometry, read by the grid AND its shell (BRIEF_COURSES_SKELETONS 2.3). */
export const TOUGH_TILE_H = 150;
export const TOUGH_GAP = 2;
export const TOUGH_COUNT = 4;
/** Pool the rotation draws from (BRIEF_COURSES_TOUGH_TRACKS_ROTATION). */
export const TOUGH_POOL = 24;
export const TOUGH_LAST_KEY = 'courses.toughTracks.last';

const byToughest = (a: StatBrowseRow, b: StatBrowseRow) => (b.avg_to_par ?? -Infinity) - (a.avg_to_par ?? -Infinity);

/** Pure: four tough courses, preferring ones not shown last visit, toughest first. */
export function pickToughFour(rows: StatBrowseRow[], previousIds: string[], rand: () => number = Math.random): StatBrowseRow[] {
  if (rows.length <= TOUGH_COUNT) return [...rows].sort(byToughest);
  const pool = [...rows];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const seen = new Set(previousIds);
  const fresh = pool.filter((r) => !seen.has(r.course_id));
  const stale = pool.filter((r) => seen.has(r.course_id));
  return [...fresh, ...stale].slice(0, TOUGH_COUNT).sort(byToughest);
}

function readLast(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(TOUGH_LAST_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}
function writeLast(ids: string[]) {
  try { localStorage.setItem(TOUGH_LAST_KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
}

/** SECTION 04 — THE HARDEST TESTS (BRIEF_COURSES_PAGE_REBUILD §6). */
export function HardestSection() {
  const navigate = useNavigate();
  const { rows, isLoading } = useStatBrowseList({ lens: 'toughest', country: null, region: null, limit: TOUGH_POOL });
  const poolKey = rows.map((r) => r.course_id).join('|');
  const firstPick = useRef<StatBrowseRow[] | null>(null);
  // Once per mount: the first pick after the pool loads is held for the visit.
  const picked = useMemo(() => {
    if (firstPick.current) return firstPick.current;
    if (rows.length === 0) return [];
    const next = pickToughFour(rows, readLast());
    firstPick.current = next;
    writeLast(next.map((r) => r.course_id));
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey]);
  useSectionReady('hardest', !isLoading);
  if (isLoading) return <HardestShell />;
  if (rows.length === 0) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="Over par on average" title="Tough tracks" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: TOUGH_GAP, marginLeft: -16, marginRight: -16, marginTop: HEAD_GAP }}>
        {picked.map((row) => (
          <button key={row.course_id} type="button" onClick={() => navigate(`/courses/${row.course_id}`)}
            style={{ height: TOUGH_TILE_H, padding: 0, border: 'none', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}>
            <CourseImageFallback courseId={row.course_id} courseName={row.name} imageUrl={row.image_url} style={{ height: '100%' }}>
              <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
              <div style={{ position: 'absolute', left: 11, top: 10, fontSize: 23, fontWeight: 700, letterSpacing: '-0.045em', color: '#FFFFFF', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                {fmtToPar(row.avg_to_par) ?? '-'}
              </div>
              <div style={{ position: 'absolute', left: 11, top: 35, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>Avg over par</div>
              <div style={{ position: 'absolute', left: 11, right: 11, bottom: 10, fontSize: 13, fontWeight: 700, letterSpacing: '-0.018em', color: '#FFFFFF', lineHeight: 1.14, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{row.name}</div>
            </CourseImageFallback>
          </button>
        ))}
      </div>
    </section>
  );
}
