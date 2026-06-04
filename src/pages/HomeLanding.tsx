import { TourHubShell } from '@/features/tourhub/components/TourHubShell';
import { TourHubShellTabs } from '@/features/tourhub/components/TourHubShellTabs';
import { ShellSlot } from '@/components/header/ShellSlot';
import { OverviewPageV3 } from '@/features/tourhub/components/tabs/OverviewPageV3';

/**
 * HomeLanding — Phase 1 IA reframe.
 * Mirrors TourHubMainPage's Overview state exactly (header, shell tab pills, safe area)
 * so the landing experience matches the prior Tour Hub overview chrome.
 */
export default function HomeLanding() {
  return (
    <TourHubShell showBack={false}>
      <ShellSlot dark>
        <TourHubShellTabs />
      </ShellSlot>

      <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
        <OverviewPageV3 />
      </div>
    </TourHubShell>
  );
}
