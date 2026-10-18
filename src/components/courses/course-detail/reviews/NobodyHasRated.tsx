/** REVIEWS_STATE_1 — the signed-off invitation only. The shared sample policy
 * owns zero-rating selection. No score/sample/distribution/category placeholders.
 * Keep the existing first-review handler: no tracked-round or composer changes.
 * Shared gutters remain owned here; existing tab lead-in owns the top seam. */
import React from 'react';
import { Button } from '@/components/ui/button';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SURFACE } from '@/lib/tokens/surface';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { GUTTER } from '../about/AboutSection';
import { reviewsCourseState } from '@/lib/reviews/sampleRules';
import { REVIEWS_CATALOGUE_SNAPSHOT, reviewsCatalogueWithoutReview } from '@/lib/reviews/catalogueSnapshot';

export interface NobodyHasRatedProps {
  totalRatings: number;
  courseName: string;
  onWriteFirst: () => void;
}

export function NobodyHasRated({ totalRatings, courseName, onWriteFirst }: NobodyHasRatedProps) {
  if (reviewsCourseState(totalRatings) !== 'none') return null;
  const format = (value: number) => value.toLocaleString('en-GB');
  return (
    <section aria-labelledby="reviews-first-title" style={{ padding: `0 ${GUTTER}px 20px`, fontFamily: SANS }}>
      <div style={{ color: A.AMBER, fontSize: 11, fontWeight: 700, lineHeight: 1.2, marginBottom: 5 }}>
        NOBODY HAS RATED IT
      </div>
      <h2 id="reviews-first-title" style={{ color: SURFACE.dark.ink, fontSize: 19, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
        You would be the first
      </h2>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, color: SURFACE.dark.mute, margin: '8px 0 0' }}>
        No member has reviewed {courseName}. Yours would be the only word on it until somebody else plays.
      </p>
      <p style={{ borderLeft: `2px solid ${A.AMBER}`, paddingLeft: 11, fontSize: 13, lineHeight: 1.5, color: SURFACE.dark.body, margin: '14px 0 0' }}>
        <strong className="tabular-nums" style={{ color: SURFACE.dark.ink, fontWeight: 700 }}>
          {format(reviewsCatalogueWithoutReview())} of the {format(REVIEWS_CATALOGUE_SNAPSHOT.total)} courses
        </strong>{' '}we track have no review at all. The ones that do were started by somebody who went first.
      </p>
      <Button variant="ghost" onClick={onWriteFirst} style={{ background: SURFACE.dark.ink, color: PAGE_CANVAS, borderRadius: 999, marginTop: 15, height: 'auto', minHeight: 42, padding: '11px 22px', fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
        Write the first
      </Button>
      <p style={{ borderLeft: `2px solid ${SURFACE.dark.hairline}`, paddingLeft: 11, fontSize: 13, lineHeight: 1.5, color: SURFACE.dark.mute, margin: '18px 0 0' }}>
        Reviews score four things — design, condition, clubhouse and facilities — and you can add photographs. You do not need a tracked round here to write one.
      </p>
    </section>
  );
}