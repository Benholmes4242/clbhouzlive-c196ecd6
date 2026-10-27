/**
 * CB105 — golf club profile, section 3: "How it plays". Club profiles only;
 * replaces the retired BusinessCoursePanel and owns the BusinessClubCourse type.
 *
 * Data per course: useCourseStatsDetail(id, true) (page-shared cache) for the
 * counts/cells, and the public useCourseHoleAnalysis(id) for the hole strip.
 * The hardest hole is computed ONCE (pickHardestHole) and used by both the cell
 * and the red bar so they cannot disagree; only when the analysis is
 * unavailable (or under 9 holes) does the cell fall back to hardest_hole_no,
 * and then no strip renders. rounds_tracked counts 18-hole rounds only.
 * Easiest hole (pickEasiestHole) paints its bar green; hardest still wins a
 * tie so a hole is never both.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { A, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { ordinal } from '@/components/courses/course-detail/you/youBits';
import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import { formatNumber } from '@/i18n/format';

export interface BusinessClubCourse {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
}

const T = {
  card: '#17171B', inset: '#1E1E23', ink: '#F8FAFC', mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)', faint: 'rgba(248,250,252,0.28)', hair: 'rgba(255,255,255,0.08)',
  bar: 'rgba(248,250,252,0.22)', red: '#D9473B', green: A.GREEN,
} as const;
const TAB = { fontVariantNumeric: 'tabular-nums' } as const;

export const roundsLabel = (n: number) => (n === 1 ? '1 round' : `${formatNumber(n)} rounds`);

/** Largest avg_to_par; ties → lower stroke index (null last), then lower hole number. */
export function pickHardestHole(holes: CourseHole[]): number | null {
  if (!holes.length) return null;
  const si = (h: CourseHole) => h.stroke_index ?? Infinity;
  return [...holes].sort((a, b) => b.avg_to_par - a.avg_to_par || si(a) - si(b) || a.hole_no - b.hole_no)[0].hole_no;
}

/** Lowest avg_to_par; ties → higher stroke index (easier by rating, nulls last),
 *  then lower hole number. */
export function pickEasiestHole(holes: CourseHole[]): number | null {
  if (!holes.length) return null;
  const si = (h: CourseHole) => h.stroke_index ?? -Infinity;
  return [...holes].sort((a, b) => a.avg_to_par - b.avg_to_par || si(b) - si(a) || a.hole_no - b.hole_no)[0].hole_no;
}

/** Bar height %: max(8, avg_to_par ÷ course max × 100); at/under par sits at the floor. */
export function holeBarHeights(holes: CourseHole[]): number[] {
  const max = Math.max(0, ...holes.map((h) => h.avg_to_par));
  return holes.map((h) => (max > 0 ? Math.max(8, (Math.max(0, h.avg_to_par) / max) * 100) : 8));
}

function CourseBlock({ course, position, isFirst, onOpen, onResolved }: {
  course: BusinessClubCourse; position: number; isFirst: boolean;
  onOpen: (id: string, position: number) => void;
  onResolved: (id: string, hasFigures: boolean, rounds: number) => void;
}) {
  const { data: stats, isLoading } = useCourseStatsDetail(course.id, true);
  const { data: analysis } = useCourseHoleAnalysis(course.id);
  const rounds = stats?.rounds_tracked ?? 0;
  const holes = analysis?.available && (analysis.holes?.length ?? 0) >= 9
    ? [...analysis.holes].sort((a, b) => a.hole_no - b.hole_no) : null;
  const hardest = holes ? pickHardestHole(holes) : stats?.hardest_hole_no ?? null;

  const cells: { value: string; label: string }[] = [];
  if (rounds > 0) {
    const toPar = toParParts(stats?.avg_over_par, 1);
    if (toPar) cells.push({ value: toPar.text, label: 'average over par' });
    if (hardest != null) cells.push({ value: ordinal(hardest), label: 'hardest hole' });
    if (stats?.harder_than_pct != null) cells.push({ value: `${Math.round(stats.harder_than_pct)}%`, label: 'of courses play easier' });
  }

  const reported = useRef(false);
  const settled = !isLoading;
  useEffect(() => {
    if (reported.current || !settled) return;
    reported.current = true;
    onResolved(course.id, cells.length > 0, rounds);
  }, [settled, cells.length, rounds, course.id, onResolved]);

  const heights = holes ? holeBarHeights(holes) : [];
  return (
    <button type="button" data-club-plays-course={course.id} onClick={() => onOpen(course.id, position)}
      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, margin: 0,
        borderTop: isFirst ? 0 : `1px solid ${T.hair}`, padding: isFirst ? '4px 0 14px' : '14px 0',
        color: 'inherit', font: 'inherit', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <b data-club-plays-name style={{ fontSize: 15.5, fontWeight: 600, color: T.ink }}>{courseNameWithinClub(course.name)}</b>
        {settled && (
          <span data-club-plays-count style={{ fontSize: 12.5, color: T.dim, whiteSpace: 'nowrap', ...TAB }}>
            {rounds >= 1 && rounds <= 9 && (
              <span data-club-plays-early style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: T.dim, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '2px 7px', marginRight: 6 }}>Early data</span>
            )}
            {rounds === 0 ? 'No rounds yet ›' : `${roundsLabel(rounds)} ›`}
          </span>
        )}
      </div>
      {settled && rounds > 0 && cells.length > 0 && (
        <div data-club-plays-cells style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`, gap: 8, marginTop: 10 }}>
          {cells.map((c) => (
            <div key={c.label} data-club-plays-cell style={{ background: T.inset, borderRadius: 13, padding: 10 }}>
              <b style={{ display: 'block', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: T.ink, ...TAB }}>{c.value}</b>
              <i style={{ display: 'block', fontStyle: 'normal', fontSize: 11, lineHeight: 1.3, color: T.mute, marginTop: 3 }}>{c.label}</i>
            </div>
          ))}
        </div>
      )}
      {settled && rounds > 0 && holes && (
        <>
          <div data-club-plays-strip style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 34, marginTop: 12 }}>
            {holes.map((h, i) => (
              <i key={h.hole_no} data-hole={h.hole_no} data-hardest={h.hole_no === hardest ? 'true' : undefined}
                style={{ flex: 1, height: `${heights[i]}%`, borderRadius: '2px 2px 0 0', background: h.hole_no === hardest ? T.red : T.bar }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: T.faint, marginTop: 4, ...TAB }}>
            <span>1</span><span>Over par by hole</span><span>{holes[holes.length - 1].hole_no}</span>
          </div>
        </>
      )}
    </button>
  );
}

export function ClubHowItPlays({ isClub, courses, onOpen, onFiguresResolved }: {
  isClub: boolean; courses: BusinessClubCourse[];
  onOpen: (id: string, position: number) => void;
  onFiguresResolved?: (id: string, hasFigures: boolean, rounds: number) => void;
}) {
  const [totals, setTotals] = useState<Record<string, number>>({});
  const handleResolved = useCallback((id: string, hasFigures: boolean, rounds: number) => {
    setTotals((p) => ({ ...p, [id]: rounds }));
    onFiguresResolved?.(id, hasFigures, rounds);
  }, [onFiguresResolved]);
  if (!isClub || courses.length === 0) return null;
  const allIn = courses.every((c) => c.id in totals);
  const total = courses.reduce((s, c) => s + (totals[c.id] ?? 0), 0);
  return (
    <section data-club-how-it-plays style={{ background: T.card, border: `1px solid ${T.hair}`, borderRadius: 18, padding: 16, margin: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>How it plays</div>
        {allIn && (
          <div data-club-plays-total style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
            {roundsLabel(total)}
          </div>
        )}
      </div>
      {courses.map((c, i) => (
        <CourseBlock key={c.id} course={c} position={i} isFirst={i === 0} onOpen={onOpen} onResolved={handleResolved} />
      ))}
    </section>
  );
}
