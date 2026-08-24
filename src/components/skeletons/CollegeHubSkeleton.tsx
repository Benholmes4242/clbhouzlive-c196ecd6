/**
 * CollegeHubSkeleton - route-level Suspense fallback for the college hub
 * and college profile routes. Hero block matches the hub's charcoal
 * fallback header exactly (gradient + minHeight formula); shimmer rows
 * follow at the yearbook feed geometry.
 */
import { Skeleton } from '@/components/ui/skeleton';
import { HERO_MIN_H } from '@/features/tourhub/_shared/tokens';

const CHARCOAL = '#14161c';

export const CollegeHubSkeleton = () => {
  return (
    <div style={{ background: '#15171F', minHeight: '100dvh' }}>
      {/* Hero - matches CollegeHeroMasthead charcoal fallback exactly */}
      <div
        style={{
          background: `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`,
          minHeight: HERO_MIN_H,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Skeleton variant="dark" style={{ height: 12, width: 120, borderRadius: 4 }} />
        <Skeleton variant="dark" style={{ height: 24, width: 200, borderRadius: 6 }} />
        {/* Three-figure row: label + figure per cell (matches the masthead). */}
        <div style={{ display: 'flex', gap: 28, marginTop: 2 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <Skeleton variant="dark" style={{ height: 8, width: 48, borderRadius: 3 }} />
              <Skeleton variant="dark" style={{ height: 20, width: 54, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Feed rows */}
      <div style={{ padding: '8px 0' }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="light"
            style={{
              height: 64,
              margin: '0 16px',
              borderRadius: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
};
