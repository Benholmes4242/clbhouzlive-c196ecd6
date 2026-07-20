/**
 * ActivityPageSkeleton
 * Mirrors ActivityPageV2's real anatomy: shell header + bucket cards.
 * ActivityRowsSkeleton is shared by this fallback AND the page's
 * in-page feed hold — keep them in sync by construction.
 */
import { Skeleton } from "@/components/ui/skeleton";

const PAGE = '#F8FAFC';
const HAIR = 'rgba(15,23,42,0.10)';

export function ActivityRowsSkeleton({ buckets = 2 }: { buckets?: number }) {
  const rowCounts = [2, 3];
  return (
    <div style={{ paddingBottom: 40 }}>
      {Array.from({ length: buckets }).map((_, b) => (
        <section key={b} style={{ padding: '18px 0 6px' }}>
          <div style={{ padding: '0 16px 10px' }}>
            <Skeleton className="h-3 w-16" />
          </div>
          <div
            style={{
              margin: '0 16px',
              background: '#FFFFFF',
              border: `1px solid ${HAIR}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {Array.from({ length: rowCounts[b] ?? 2 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderTop: i === 0 ? 'none' : `1px solid ${HAIR}`,
                }}
              >
                <Skeleton className="h-10 w-10 flex-shrink-0" style={{ borderRadius: '36%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ActivityPageSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: PAGE }}>
      {/* Shell header mirror: back chevron + left title + right action */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: `1px solid ${HAIR}`,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>

      <ActivityRowsSkeleton buckets={2} />
    </div>
  );
}

export default ActivityPageSkeleton;
