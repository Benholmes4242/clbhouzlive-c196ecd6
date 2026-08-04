/** TEMPORARY verification harness — deleted after screenshots. */
import React from 'react';
import { PostCourseBand } from '@/components/feed/PostCourseBand';
import { ReviewGhostNumeral, ReviewVerdictLabel } from '@/components/shared/ReviewGhostScore';

const ctxBest = {
  course_id: 'c1', rounds_tracked: 40, your_rounds: 3, your_best: 82,
  avg_over_par: 6.2, harder_than_pct: 50, community_rating: 8.4,
} as never;
const ctxHard = {
  course_id: 'c1', rounds_tracked: 40, your_rounds: 0, your_best: null,
  avg_over_par: 9.1, harder_than_pct: 92, community_rating: 7.9,
} as never;
const ctxEasy = {
  course_id: 'c1', rounds_tracked: 40, your_rounds: 0, your_best: null,
  avg_over_par: 2.1, harder_than_pct: 8, community_rating: 6.4,
} as never;

const Actions = () => (
  <div style={{ padding: '10px 14px', fontSize: 12, color: '#94A3B8' }}>actions row</div>
);

export default function DevBandHarness() {
  return (
    <div>
      {[8.4, 9.3, 4.2].map((r) => (
        <div key={r} style={{ position: 'relative', overflow: 'hidden', background: '#F8FAFC', padding: '14px 12px', marginBottom: 2 }}>
          <ReviewGhostNumeral rating={r} surface="light" />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <ReviewVerdictLabel rating={r} surface="light" />
          </div>
        </div>
      ))}
      <div style={{ background: '#F8FAFC' }}>
        <PostCourseBand courseName="Royal Porthcawl Golf Club" courseLocation="South Wales · Britain" ctx={ctxBest} onOpenStats={() => {}} actions={<Actions />} tone="light" />
        <PostCourseBand courseName="Carnoustie Golf Links" courseLocation="Angus · Scotland" ctx={ctxHard} onOpenStats={() => {}} actions={<Actions />} tone="light" />
        <PostCourseBand courseName="Brancepeth Castle" courseLocation="Durham · England" ctx={ctxEasy} onOpenStats={() => {}} actions={<Actions />} tone="light" />
      </div>
      <div style={{ background: '#10151C' }}>
        {[9.3, 4.2].map((r) => (
          <div key={r} style={{ position: 'relative', overflow: 'hidden', padding: '14px 12px' }}>
            <ReviewGhostNumeral rating={r} />
            <div style={{ position: 'relative', zIndex: 2 }}><ReviewVerdictLabel rating={r} /></div>
          </div>
        ))}
        <PostCourseBand courseName="Royal Porthcawl Golf Club" courseLocation="South Wales · Britain" ctx={ctxBest} onOpenStats={() => {}} actions={<Actions />} />
        <PostCourseBand courseName="Carnoustie Golf Links" courseLocation="Angus · Scotland" ctx={ctxHard} onOpenStats={() => {}} actions={<Actions />} />
        <PostCourseBand courseName="Brancepeth Castle" courseLocation="Durham · England" ctx={ctxEasy} onOpenStats={() => {}} actions={<Actions />} />
      </div>
    </div>
  );
}
