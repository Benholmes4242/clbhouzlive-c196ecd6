import { TourHubShell } from '@/features/tourhub/components/TourHubShell';
import { OverviewPageV3 } from '@/features/tourhub/components/tabs/OverviewPageV3';

/**
 * HomeLanding — Phase 1 IA reframe.
 * Mirrors TourHubMainPage's Overview state (island-driven navigation, no
 * top strip). Strip removed CHROME-2; --chrome-total-h collapses to 0.
 */
export default function HomeLanding() {
  return (
    <TourHubShell showBack={false}>
      <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
        <OverviewPageV3 />
      </div>
    </TourHubShell>
  );
}

