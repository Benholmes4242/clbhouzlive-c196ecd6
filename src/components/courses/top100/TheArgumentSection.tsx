import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { SectionHead, HEAD_GAP, SECTION_WRAP } from '@/components/courses/browse/SectionHead';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { ArgumentRow } from './theArgument';
import { ordinal } from '@/lib/text/numbers';

/* Row geometry, read by the rows AND their shell (BRIEF_COURSES_SKELETONS 3.4). */
export const ARGUMENT_THUMB = { size: 52, radius: 8 } as const;
export const ARGUMENT_ROW_GAP = 12;

/** BRIEF_TOP_100_REBUILD §3. The caller renders nothing when rows is empty. */
export function TheArgumentSection({ rows, qualifying }: { rows: ArgumentRow[]; qualifying: number }) {
  return (
    <section style={SECTION_WRAP}>
      <SectionHead kicker="Golfers versus the list" title="Where the ratings and the rankings differ" />
      <div style={{ marginTop: HEAD_GAP, display: 'grid', gap: ARGUMENT_ROW_GAP }}>
        {rows.map((r) => {
          const up = r.divergence > 0;
          const tone = up ? A.GREEN : A.RED;
          const Arrow = up ? ArrowUp : ArrowDown;
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: ARGUMENT_THUMB.size, height: ARGUMENT_THUMB.size, borderRadius: ARGUMENT_THUMB.radius, overflow: 'hidden', flexShrink: 0 }}>
                <CourseImageFallback courseId={r.id} courseName={r.name} imageUrl={r.imageUrl} style={{ height: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                {/* Two lines, one fact each: the list's position, then the community's. The member rating value and the rating count are deliberately NOT printed here — this section is about where a course SITS, not what it scored. rating and ratingCount are still required in theArgument.ts (rating orders memberRank, ratingCount gates MIN_RATINGS), so do not remove them from the types because this row stopped showing them. */}
                <div style={{ fontSize: 11, color: A.DIM, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                  Official rank <b style={{ color: A.BODY, fontWeight: 600 }}>#{r.publishedRank}</b>
                </div>
                <div style={{ fontSize: 11, color: A.DIM, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  Golfers rank it <b style={{ color: A.BODY, fontWeight: 600 }}>{ordinal(r.memberRank)}</b> of the{' '}
                  <b style={{ color: A.BODY, fontWeight: 600 }}>{qualifying}</b> rated
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 17, fontWeight: 800, color: tone, fontVariantNumeric: 'tabular-nums' }}>
                  <Arrow size={14} strokeWidth={3} aria-hidden />
                  {Math.abs(r.divergence)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
