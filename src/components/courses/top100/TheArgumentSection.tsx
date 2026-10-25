import React from 'react';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SectionHead, SECTION_WRAP } from '@/components/courses/browse/SectionHead';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { ArgumentRow } from './theArgument';
import { ordinal } from '@/lib/text/numbers';

/* Row geometry, read by the rows AND their shell (BRIEF_COURSES_SKELETONS 3.4). */
export const ARGUMENT_THUMB = { size: 52, radius: 8 } as const;
export const ARGUMENT_ROW_GAP = 12;

interface Props {
  higher: ArgumentRow[];
  lower: ArgumentRow[];
  ratedCount: number;
  onOpenCourse: (courseId: string) => void;
  /** BRIEF_TOP100_MONTHLY_MOVE: golfers' position four weeks ago, per course.
   *  Absent or missing a course = no trend line, no reserved height. */
  baseline?: Map<string, number>;
}

function ArgumentGroup({ label, rows, baseline, ratedCount, onOpenCourse }: { label: string; rows: ArgumentRow[] } & Pick<Props, 'baseline' | 'ratedCount' | 'onOpenCourse'>) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginTop: 18 }}>
      {/* The Courses page eyebrow (the SectionHead 'quiet' tone): the coloured
          dot is gone, so the label carries no tone of its own. */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1, color: A.MUTE }}>
        {label}
      </div>

      {/* minmax(0, 1fr): a long course name ellipsises instead of pushing the
          right-hand column off the edge (the mock hit this with
          "Royal County Down (Championship)"). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: ARGUMENT_ROW_GAP, marginTop: 10 }}>
        {rows.map((r) => {
          const up = r.divergence > 0;
          const rowTone = up ? A.GREEN : A.RED;
          const Arrow = up ? ArrowUp : ArrowDown;
          /* Positive = golfers moved it UP over the last four weeks. */
          const move = baseline?.has(r.id) ? (baseline.get(r.id) as number) - r.memberRank : null;
          return (
            <Button
              key={r.id}
              type="button"
              variant="ghost"
              aria-label={`${r.name}, open course`}
              onClick={() => onOpenCourse(r.id)}
              className="h-auto rounded-none justify-start active:scale-100 active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-auto"
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', minHeight: 52, WebkitTapHighlightColor: 'transparent' }}
            >
              <div style={{ width: ARGUMENT_THUMB.size, height: ARGUMENT_THUMB.size, borderRadius: ARGUMENT_THUMB.radius, overflow: 'hidden', flexShrink: 0 }}>
                <CourseImageFallback courseId={r.id} courseName={r.name} imageUrl={r.imageUrl} style={{ height: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                {/* Golfers' position is within the qualifying rated set; the
                    official position is the active list's real published rank.
                    listRank is not printed, but stays in the type and maths for
                    divergence/grouping. rating and ratingCount still order and
                    qualify the set. The panel owns ratedCount and hands row taps
                    to the main list's scroll-preserving course opener. */}
                <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.35, color: A.DIM, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Golfers rank it <b style={{ color: A.BODY, fontWeight: 600 }}>{ordinal(r.memberRank)}</b> of the {ratedCount} rated
                </div>
                <div style={{ marginTop: 1, fontSize: 11.5, lineHeight: 1.35, color: A.DIM, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Officially ranked <b style={{ color: A.BODY, fontWeight: 600 }}>{ordinal(r.publishedRank)}</b>
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 17, fontWeight: 800, color: rowTone, fontVariantNumeric: 'tabular-nums' }}>
                  <Arrow size={14} strokeWidth={3} aria-hidden />
                  {Math.abs(r.divergence)}
                </div>
                {move !== null ? (
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                      color: move > 0 ? A.GREEN : move < 0 ? A.RED : A.DIM,
                    }}
                  >
                    {move > 0 ? `↑${move} this month` : move < 0 ? `↓${Math.abs(move)} this month` : 'No change'}
                  </div>
                ) : null}
              </div>
              <ChevronRight size={14} strokeWidth={2.5} style={{ color: A.DIM, flexShrink: 0, marginLeft: -4 }} aria-hidden />
            </Button>
          );
        })}
      </div>
    </div>
  );
}

/** BRIEF_TOP100_GOLFERS_VS_OFFICIAL. The caller renders nothing when both groups are empty. */
export function TheArgumentSection({ higher, lower, baseline, ratedCount, onOpenCourse }: Props) {
  if (higher.length === 0 && lower.length === 0) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead kicker="Golfers versus the official list" title="Where the ratings and the rankings differ" />
      {/* Sub-line geometry matches "The list" ("Ranked by clbhouz members'
          average rating."): 8 / 12 / 1.4 / A.DIM. The qualifying count is no
          longer printed. */}
      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4, color: A.DIM }}>
        The courses that vary the most between the golfers' ratings and the official rankings.
      </div>
      <ArgumentGroup label="Golfers rate higher" rows={higher} baseline={baseline} ratedCount={ratedCount} onOpenCourse={onOpenCourse} />
      <ArgumentGroup label="Golfers rate lower" rows={lower} baseline={baseline} ratedCount={ratedCount} onOpenCourse={onOpenCourse} />
    </section>
  );
}
