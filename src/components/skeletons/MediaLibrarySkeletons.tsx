/**
 * BRIEF_WATCH_SEE_ALL S3.8 — route-level Suspense fallbacks for
 * /explore/reviews and /explore/moments. They EXPAND OUTWARDS: head, sort rail
 * and two rows of tiles only, never more than the smallest settled state they
 * resolve into.
 */
import type { CSSProperties } from 'react';

const TILE = 'rgba(255,255,255,0.06)';
const TOP_PAD = 'calc(env(safe-area-inset-top, 0px) + 47px)';

function Block({ style }: { style?: CSSProperties }) {
  return <div className="clb-shimmer-light" style={{ background: TILE, ...style }} />;
}

function Head() {
  return (
    <>
      <div style={{ padding: '18px 0 14px' }}>
        <Block style={{ width: 72, height: 11, borderRadius: 4 }} />
        <Block style={{ marginTop: 10, width: 180, height: 20, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 16, paddingBottom: 14 }}>
        <Block style={{ width: 74, height: 13, borderRadius: 4 }} />
        <Block style={{ width: 82, height: 13, borderRadius: 4 }} />
        <Block style={{ width: 66, height: 13, borderRadius: 4 }} />
      </div>
    </>
  );
}

export function ReviewsLibrarySkeleton() {
  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: TOP_PAD }}>
      <div style={{ padding: '0 14px' }}>
        <Head />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <Block style={{ height: 132, borderRadius: 10 }} />
              <Block style={{ marginTop: 7, height: 12, width: '70%', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MomentsLibrarySkeleton() {
  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: TOP_PAD }}>
      <div style={{ padding: '0 14px' }}>
        <Head />
        <div style={{ display: 'flex', gap: 5 }}>
          <Block style={{ flex: 1, height: 250, borderRadius: 10 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Block style={{ height: 122.5, borderRadius: 10 }} />
            <Block style={{ height: 122.5, borderRadius: 10 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
