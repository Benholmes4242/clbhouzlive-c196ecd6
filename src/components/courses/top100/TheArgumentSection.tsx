import React from 'react';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';

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
  qualifying: number;
  showGolfersLink: boolean;
  onSeeGolfersList: () => void;
  /** BRIEF_TOP100_MONTHLY_MOVE: golfers' position four weeks ago, per course.
   *  Absent or missing a course = no trend line, no reserved height. */
  baseline?: Map<string, number>;
}

function ArgumentGroup({ label, tone, rows, baseline }: { label: string; tone: string; rows: ArgumentRow[]; baseline?: Map<string, number> }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.BODY }}>
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: tone, flexShrink: 0 }} />
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
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: ARGUMENT_THUMB.size, height: ARGUMENT_THUMB.size, borderRadius: ARGUMENT_THUMB.radius, overflow: 'hidden', flexShrink: 0 }}>
                <CourseImageFallback courseId={r.id} courseName={r.name} imageUrl={r.imageUrl} style={{ height: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                {/* One line, both positions within the qualifying set. The member
                    rating value, the rating count and the rank out of 100 are
                    deliberately NOT printed here — this section is about where a
                    course SITS, not what it scored. rating and ratingCount are
                    still required in theArgument.ts (rating orders memberRank,
                    ratingCount gates MIN_RATINGS), so do not remove them from
                    the types because this row stopped showing them. */}
                <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.35, color: A.DIM, fontVariantNumeric: 'tabular-nums' }}>
                  Golfers rank it <b style={{ color: A.BODY, fontWeight: 600 }}>{ordinal(r.memberRank)}</b> versus{' '}
                  <b style={{ color: A.BODY, fontWeight: 600 }}>{ordinal(r.listRank)}</b> on the official list
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** BRIEF_TOP100_GOLFERS_VS_OFFICIAL. The caller renders nothing when both groups are empty. */
export function TheArgumentSection({ higher, lower, qualifying, showGolfersLink, onSeeGolfersList, baseline }: Props) {
  if (higher.length === 0 && lower.length === 0) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead kicker="Golfers versus the official list" title="Where the ratings and the rankings differ" />
      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.5, color: A.MUTE }}>
        {`The courses that vary the most between the golfers' ratings and the official rankings. Positions are out of the ${qualifying} courses on this list that golfers have rated.`}
      </div>
      <ArgumentGroup label="Golfers rate higher" tone={A.GREEN} rows={higher} baseline={baseline} />
      <ArgumentGroup label="Golfers rate lower" tone={A.RED} rows={lower} baseline={baseline} />
      {showGolfersLink ? (
        <button
          type="button"
          onClick={onSeeGolfersList}
          style={{ marginTop: 18, minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 0, padding: 0, fontSize: 13, fontWeight: 700, color: A.INK, cursor: 'pointer' }}
        >
          See the golfers' list
          <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </section>
  );
}
