import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { SectionHead, HEAD_GAP, SECTION_WRAP } from '@/components/courses/browse/SectionHead';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { ArgumentRow } from './theArgument';

/** BRIEF_TOP_100_REBUILD §3. The caller renders nothing when rows is empty. */
export function TheArgumentSection({ rows }: { rows: ArgumentRow[] }) {
  return (
    <section style={SECTION_WRAP}>
      <SectionHead kicker="The argument" title="Where we disagree with the list" />
      <div style={{ marginTop: HEAD_GAP, display: 'grid', gap: 12 }}>
        {rows.map((r) => {
          const up = r.divergence > 0;
          const tone = up ? A.GREEN : A.RED;
          const Arrow = up ? ArrowUp : ArrowDown;
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <CourseImageFallback courseId={r.id} courseName={r.name} imageUrl={r.imageUrl} style={{ height: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: A.DIM, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                  List says <b style={{ color: A.BODY, fontWeight: 600 }}>#{r.publishedRank}</b> · members rate it{' '}
                  <b style={{ color: A.BODY, fontWeight: 600 }}>{r.rating.toFixed(1)}</b> from{' '}
                  <b style={{ color: A.BODY, fontWeight: 600 }}>{r.ratingCount}</b> ratings
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 17, fontWeight: 800, color: tone, fontVariantNumeric: 'tabular-nums' }}>
                  <Arrow size={14} strokeWidth={3} aria-hidden />
                  {Math.abs(r.divergence)}
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: A.FAINT }}>We rank it</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
