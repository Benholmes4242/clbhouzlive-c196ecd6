/**
 * TourHubOverviewSkeleton — route-level Suspense fallback for /tourhub.
 * The hero block replicates EXACTLY the hold OverviewHero renders during its
 * own isLoading state (528px, radius 20, INK_TINT_06 diagonal gradient), so
 * chunk-load → hero-loading → hero is one continuous frame. Two section
 * frames follow at the LazySection reservation heights.
 */
import { Skeleton } from '@/components/ui/skeleton';
import { INK_TINT_06 } from '@/features/tourhub/_shared/tokens';
import { SPACE } from '@/lib/spacing';

export const TourHubOverviewSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero — MUST mirror the mounted OverviewHero.isLoading hold exactly. */}
      <div
        style={{
          height: 528,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${INK_TINT_06}, rgba(15,23,42,0.02))`,
        }}
        aria-busy
      />

      {/* Two below-hero section reservations — match LazySection's 400px minHeight. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACE.sectionSection,
          paddingTop: SPACE.sectionSection,
          paddingBottom: 88,
        }}
      >
        <div style={{ minHeight: 400, padding: '0 16px' }} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div style={{ minHeight: 400, padding: '0 16px' }} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default TourHubOverviewSkeleton;
