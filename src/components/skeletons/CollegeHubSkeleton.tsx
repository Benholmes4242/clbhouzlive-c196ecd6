/**
 * CollegeHubSkeleton — route-level Suspense fallback for the college hub
 * and college profile routes. Hero block matches the hub's charcoal
 * fallback header exactly (gradient + minHeight formula); shimmer rows
 * follow at the yearbook feed geometry.
 */
import { Skeleton } from '@/components/ui/skeleton';

const CHARCOAL = '#14161c';
const HAIRLINE_INK_10 = 'rgba(15,23,42,0.10)';

export const CollegeHubSkeleton = () => {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100dvh' }}>
      {/* Hero — matches CollegeHeroMasthead charcoal fallback exactly */}
      <div
        style={{
          background: `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`,
          minHeight:
            'calc(clamp(280px, 34dvh, 360px) + env(safe-area-inset-top, 0px))',
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
        <Skeleton variant="dark" style={{ height: 32, width: 220, borderRadius: 6 }} />
        <Skeleton variant="dark" style={{ height: 12, width: 160, borderRadius: 4 }} />
      </div>

      {/* Feed rows */}
      <div style={{ padding: '8px 0' }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="light"
            style={{
              height: 82,
              margin: '0 16px',
              borderRadius: 0,
              borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
