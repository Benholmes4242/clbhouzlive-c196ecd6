/**
 * CoursesHubSkeleton — route-level Suspense fallback for /courses only.
 * Mirrors the real hub: full-bleed dark hero (AmateurCircuitHero holds the
 * same gradient while its own data loads, so the handoff is seamless),
 * tabs strip, ticker bar, chips row, two-column grid tiles.
 * The other list-shaped course routes keep CoursesListSkeleton.
 */
import { Skeleton } from '@/components/ui/skeleton';

const HERO_MIN_HEIGHT =
  'calc(clamp(280px, 35dvh, 390px) + env(safe-area-inset-top, 0px))';

export const CoursesHubSkeleton = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#15171F' }}>
      {/* Hero hold — same gradient AmateurCircuitHero uses for its own
          isLoading state, so fallback -> hero-loading -> hero is one frame */}
      <div
        style={{
          minHeight: HERO_MIN_HEIGHT,
          width: '100%',
          background:
            'linear-gradient(180deg, #1E4D38, #0F172A)',
        }}
      />

      {/* Sticky tabs strip mirror */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '12px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          background: '#1B1E27',
        }}
      >
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>

      {/* Ticker bar */}
      <div style={{ padding: '10px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <Skeleton className="h-4 w-full rounded" />
      </div>

      {/* Identity strip */}
      <div style={{ padding: '12px 16px' }}>
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>

      {/* Chips row */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', overflow: 'hidden' }}>
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        <Skeleton className="h-8 w-16 rounded-full shrink-0" />
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
      </div>

      {/* Two-column grid tiles (gap 4, inset 4 — matches ExploreGrid) */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 4px 0' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Skeleton className="w-full rounded-md" style={{ aspectRatio: '9 / 14' }} />
          <Skeleton className="w-full rounded-md" style={{ aspectRatio: '9 / 14' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Skeleton className="w-full rounded-md" style={{ aspectRatio: '9 / 14' }} />
          <Skeleton className="w-full rounded-md" style={{ aspectRatio: '9 / 14' }} />
        </div>
      </div>
    </div>
  );
};
