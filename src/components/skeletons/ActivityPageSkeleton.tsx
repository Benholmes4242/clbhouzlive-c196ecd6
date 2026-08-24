/**
 * ActivityPageSkeleton
 * Mirrors ActivityPageV2's real anatomy: shell header + bucket cards.
 * ActivityRowsSkeleton is shared by this fallback AND the page's
 * in-page feed hold — keep them in sync by construction.
 */
import { Skeleton } from "@/components/ui/skeleton";

import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * BRIEF_ACTIVITY_PAGE_DARK §6. Two changes: the page and its rules go dark,
 * and the shell stops being LARGER than the state it resolves into. The settled
 * page draws FLAT rows on the canvas with a 0.5px hairline under each and 9px
 * 18px padding — it has no white bucket card, no 16px side margin and no 16px
 * radius. The skeleton was drawing all three, so it collapsed on load.
 */
const PAGE = A.CANVAS;
const HAIR = A.BORDER;

export function ActivityRowsSkeleton({ buckets = 2 }: { buckets?: number }) {
  const rowCounts = [2, 3];
  return (
    <div style={{ paddingBottom: 40 }}>
      {Array.from({ length: buckets }).map((_, b) => (
        <section key={b} style={{ padding: '18px 0 6px' }}>
          <div style={{ padding: '18px 18px 8px' }}>
            <Skeleton className="h-3 w-16" />
          </div>
          <div>
            {Array.from({ length: rowCounts[b] ?? 2 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 18px',
                  borderBottom: `0.5px solid ${HAIR}`,
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
          background: PAGE,
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
