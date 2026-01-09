import {
  TourHero,
  RightNowCard,
  SeasonSnapshot,
  TopPlayersPreview,
  SeasonLeadersPreview,
  CoursesSpotlight,
  DataUnlockingSection,
} from '../overview';

export function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Tour Hero */}
      <TourHero />

      {/* Right Now Card - Emotional Anchor */}
      <RightNowCard />

      {/* Season Snapshot - Visual Stats */}
      <SeasonSnapshot />

      {/* Two Column Layout for Players & Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPlayersPreview />
        <SeasonLeadersPreview />
      </div>

      {/* Courses Spotlight */}
      <CoursesSpotlight />

      {/* Data Unlocking Soon */}
      <DataUnlockingSection />
    </div>
  );
}
