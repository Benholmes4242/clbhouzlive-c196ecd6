import { TourHubShell } from '@/features/tourhub/components/TourHubShell';
import { OverviewPageV3 } from '@/features/tourhub/components/tabs/OverviewPageV3';

/**
 * HomeLanding — Phase 1 IA reframe.
 * Tour Hub Overview content surfaced at root `/`.
 * No tab strip (Overview IS the page now). Full Tour Hub tab strip remains at `/tourhub`.
 */
export default function HomeLanding() {
  return (
    <TourHubShell>
      <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
        <OverviewPageV3 />
      </div>
    </TourHubShell>
  );
}
