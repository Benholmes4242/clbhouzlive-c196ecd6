/**
 * WatchSkeletons — route-level Suspense fallbacks for /watch, /watch/clips,
 * /watch/videos. Mirror each page's real layout so the chunk-load frame and
 * the page's own section skeletons read as one continuous loading state.
 * Bundled eagerly (imported by App.tsx) so the fallback isn't itself lazy.
 */
import type { CSSProperties } from 'react';

const TILE = 'rgba(0,0,0,0.06)';
const TOP_PAD = 'calc(env(safe-area-inset-top, 0px) + 62px)';

function Block({ style }: { style?: CSSProperties }) {
  return (
    <div
      className="clb-shimmer-light"
      style={{ background: TILE, ...style }}
    />
  );
}

export function WatchHubSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingTop: TOP_PAD }}
    >
      {/* Destination doors row */}
      <div style={{ display: 'flex', gap: 10, padding: '0 4px 16px' }}>
        <Block style={{ flex: 1, height: 60, borderRadius: 14 }} />
        <Block style={{ flex: 1, height: 60, borderRadius: 14 }} />
      </div>

      {/* Long form rail */}
      <div style={{ padding: '4px 16px 10px' }}>
        <Block style={{ width: 160, height: 14, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '0 4px 20px', overflow: 'hidden' }}>
        <Block
          style={{
            width: 'min(374px, calc(100vw - 32px))',
            flexShrink: 0,
            aspectRatio: '16 / 9',
            borderRadius: 4,
          }}
        />
        <Block
          style={{
            width: 'min(374px, calc(100vw - 32px))',
            flexShrink: 0,
            aspectRatio: '16 / 9',
            borderRadius: 4,
          }}
        />
      </div>

      {/* Quick clips rail */}
      <div style={{ padding: '4px 16px 10px' }}>
        <Block style={{ width: 140, height: 14, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '0 4px', overflow: 'hidden' }}>
        <Block style={{ width: 143, flexShrink: 0, aspectRatio: '9 / 14', borderRadius: 4 }} />
        <Block style={{ width: 143, flexShrink: 0, aspectRatio: '9 / 14', borderRadius: 4 }} />
        <Block style={{ width: 143, flexShrink: 0, aspectRatio: '9 / 14', borderRadius: 4 }} />
      </div>
    </div>
  );
}

export function WatchClipsSkeleton() {
  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: TOP_PAD }}>
      {/* Chips row */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px 12px' }}>
        <Block style={{ width: 68, height: 28, borderRadius: 999 }} />
        <Block style={{ width: 84, height: 28, borderRadius: 999 }} />
        <Block style={{ width: 72, height: 28, borderRadius: 999 }} />
      </div>
      {/* Two-column masonry */}
      <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
        <div style={{ flex: 1 }}>
          <Block style={{ width: '100%', aspectRatio: '9 / 14', borderRadius: 4, marginBottom: 12 }} />
          <Block style={{ width: '100%', aspectRatio: '9 / 14', borderRadius: 4, marginBottom: 12 }} />
        </div>
        <div style={{ flex: 1 }}>
          <Block style={{ width: '100%', aspectRatio: '9 / 14', borderRadius: 4, marginBottom: 12 }} />
          <Block style={{ width: '100%', aspectRatio: '9 / 14', borderRadius: 4, marginBottom: 12 }} />
        </div>
      </div>
    </div>
  );
}

export function WatchVideosSkeleton() {
  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: TOP_PAD }}>
      {/* Sort tabs */}
      <div style={{ display: 'flex', gap: 12, padding: '4px 16px 12px' }}>
        <Block style={{ width: 56, height: 16, borderRadius: 4 }} />
        <Block style={{ width: 64, height: 16, borderRadius: 4 }} />
        <Block style={{ width: 72, height: 16, borderRadius: 4 }} />
      </div>
      {/* Category chips strip */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px 12px' }}>
        <Block style={{ width: 52, height: 28, borderRadius: 999 }} />
        <Block style={{ width: 96, height: 28, borderRadius: 999 }} />
        <Block style={{ width: 82, height: 28, borderRadius: 999 }} />
      </div>
      {/* Stacked cards */}
      <div style={{ padding: '12px 4px 0' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <Block style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 9, marginTop: 8 }}>
              <Block style={{ width: 30, height: 30, borderRadius: '34%', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Block style={{ height: 12, borderRadius: 4 }} />
                <Block style={{ marginTop: 6, height: 10, width: '60%', borderRadius: 4 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
