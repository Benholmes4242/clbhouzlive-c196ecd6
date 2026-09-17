/**
 * Tour Overview loading silhouette.
 *
 * A skeleton block is updated in the same pass as its section, never later.
 * Only the two certain blocks render: the 300px hero and its board card.
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { INK_TINT_06, SURFACE } from '@/features/tourhub/_shared/tokens';
import { OVERVIEW_HERO_TOTAL_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';

function Bar({ width, height = 10 }: { width: number | string; height?: number }) {
  return <div className="clb-shimmer-dark" style={{ width, height, borderRadius: 6, backgroundColor: A.TRACK }} />;
}

export const TourHubOverviewSkeleton = () => (
  <div style={{ minHeight: '100vh', background: A.CANVAS }} aria-hidden="true">
    <div style={{ height: OVERVIEW_HERO_TOTAL_HEIGHT, margin: '0 10px', borderRadius: 18, background: INK_TINT_06 }} />
    <div style={{ height: 142, margin: '10px 10px 0', overflow: 'hidden', borderRadius: 16, background: SURFACE }}>
      <div style={{ height: 65, padding: '14px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {[0, 1, 2].map((column) => <div key={column} style={{ width: '25%' }}><Bar width="72%" height={8} /><div style={{ marginTop: 8 }}><Bar width="100%" height={14} /></div></div>)}
      </div>
      <div style={{ margin: '4px 12px 10px', height: 44, borderRadius: 12, background: INK_TINT_06 }} />
    </div>
  </div>
);

export default TourHubOverviewSkeleton;
