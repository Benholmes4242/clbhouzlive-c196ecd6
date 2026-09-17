/**
 * Tour Overview loading silhouette.
 *
 * A skeleton block is updated in the same pass as its section, never later.
 * Only the two certain blocks render: the 300px hero and its board card.
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { INK_TINT_06, SURFACE, WHITE_ALPHA_08 } from '@/features/tourhub/_shared/tokens';
import { OVERVIEW_HERO_TOTAL_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';

function Bar({ width, height = 10 }: { width: number | string; height?: number }) {
  return <div className="clb-shimmer-dark" style={{ width, height, borderRadius: 6, backgroundColor: A.TRACK }} />;
}

export const TourHubOverviewSkeleton = () => (
  <div style={{ minHeight: '100vh', background: A.CANVAS }} aria-hidden="true">
    <div style={{ height: OVERVIEW_HERO_TOTAL_HEIGHT, margin: '0 10px', borderRadius: 18, background: INK_TINT_06 }} />
    <div style={{ margin: '10px 10px 0', overflow: 'hidden', borderRadius: 16, background: SURFACE }}>
      <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) 52px 52px', alignItems: 'center', minHeight: 34, padding: '0 14px', borderBottom: `1px solid ${WHITE_ALPHA_08}` }}>
        <Bar width={20} height={8} /><Bar width={48} height={8} /><Bar width={24} height={8} /><Bar width={28} height={8} />
      </div>
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) 52px 52px', alignItems: 'center', minHeight: 42, padding: '0 14px', borderBottom: `1px solid ${WHITE_ALPHA_08}` }}>
          <Bar width={18} /><Bar width={row === 2 ? '72%' : '58%'} /><Bar width={26} /><Bar width={22} />
        </div>
      ))}
      <div style={{ margin: '10px 12px', height: 44, borderRadius: 12, border: `1px solid ${WHITE_ALPHA_08}` }} />
    </div>
  </div>
);

export default TourHubOverviewSkeleton;
