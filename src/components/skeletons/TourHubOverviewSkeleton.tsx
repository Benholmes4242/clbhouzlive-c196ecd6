/**
 * Tour Overview loading silhouette.
 *
 * A skeleton block is updated in the same pass as its section, never later.
 * Only the two certain blocks render: the 360px hero and its flat board rows.
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { INK_TINT_06, WHITE_ALPHA_06 } from '@/features/tourhub/_shared/tokens';
import { OVERVIEW_HERO_TOTAL_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';

function Bar({ width, height = 10 }: { width: number | string; height?: number }) {
  return <div className="clb-shimmer-dark" style={{ width, height, borderRadius: 6, backgroundColor: A.TRACK }} />;
}

export const TourHubOverviewSkeleton = () => (
  <div style={{ minHeight: '100vh', background: A.CANVAS }} aria-hidden="true">
    <div data-overview-skeleton-hero style={{ height: OVERVIEW_HERO_TOTAL_HEIGHT, background: INK_TINT_06 }} />
    <div style={{ height: 142, overflow: 'hidden', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}>
      <div style={{ height: 65, padding: '14px 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}>
        {[0, 1, 2].map((column) => <div key={column} style={{ width: '25%' }}><Bar width="72%" height={8} /><div style={{ marginTop: 8 }}><Bar width="100%" height={14} /></div></div>)}
      </div>
      <div style={{ height: 44, borderBottom: `1px solid ${WHITE_ALPHA_06}` }} />
    </div>
  </div>
);

export default TourHubOverviewSkeleton;
