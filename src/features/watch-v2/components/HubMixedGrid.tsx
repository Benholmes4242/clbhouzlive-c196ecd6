import { useEffect, useMemo, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubMixedGrid, type MixedGridRow } from '../hooks/useHubMixedGrid';
import { toFeedPosts } from '../utils/toFeedPost';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { FeedCard } from '@/components/feed-cards/FeedCard';
import { segmentWall } from '@/components/feed-cards/segmentWall';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const spinKeyframes = `@keyframes hub-mixed-spin { to { transform: rotate(360deg); } }`;

function PortraitSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '0.72',
        borderRadius: 12,
        background: 'rgba(0,0,0,0.06)',
        marginBottom: 12,
      }}
    />
  );
}

function WideSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1.78',
        borderRadius: 12,
        background: 'rgba(0,0,0,0.06)',
        marginBottom: 12,
      }}
    />
  );
}

export function HubMixedGrid({ filter = 'all' }: { filter?: string } = {}) {
  const { user } = useSupabaseSession();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useHubMixedGrid(user?.id, filter);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const rows: MixedGridRow[] = useMemo(
    () => ((data?.pages ?? []).flat() as MixedGridRow[]),
    [data],
  );
  const feedPosts = useMemo(() => toFeedPosts(rows as any[]), [rows]);
  const { activeIndices, railRef } = useWatchAutoplay({
    railId: 'hub-mixed-grid',
    posts: feedPosts,
    maxActive: 3,
  });

  // Segmentation preserves the RPC's slot-weave order — flat order in,
  // flat order out. flatIndex is carried through and drives autoplay
  // (data-watch-tile-index) + openWithOrigin index.
  const segments = useMemo(() => segmentWall(rows), [rows]);

  return (
    <section style={{ fontFamily: FONT_FAMILY }}>
      <style>{spinKeyframes}</style>
      <div style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 10.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#c97a10',
          }}
        >
          EVERYTHING
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 17,
            color: '#0F172A',
            marginTop: 3,
            letterSpacing: '-0.01em',
          }}
        >
          Keep browsing
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 12,
            color: '#64748B',
            marginTop: 3,
          }}
        >
          Clips and videos, mixed
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <PortraitSkeleton />
              <PortraitSkeleton />
            </div>
            <div style={{ flex: 1 }}>
              <PortraitSkeleton />
              <PortraitSkeleton />
            </div>
          </div>
          <WideSkeleton />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            No clips yet
          </div>
          <div
            style={{
              fontWeight: 500,
              fontSize: 12,
              color: '#64748B',
              marginTop: 4,
            }}
          >
            Check back soon
          </div>
        </div>
      ) : (
        <div ref={railRef} style={{ padding: '0 16px' }}>
          {segments.map((seg, sIdx) => {
            if (seg.kind === 'wide') {
              const { row, flatIndex } = seg.item;
              return (
                <div key={`w-${row.post_id}`} style={{ marginBottom: 14 }}>
                  <FeedCard
                    row={row}
                    feedPost={feedPosts[flatIndex]}
                    posts={feedPosts}
                    flatIndex={flatIndex}
                    isAutoplayActive={activeIndices.has(flatIndex)}
                    badge={row.derived_format as 'clip' | 'video'}
                    wide
                  />
                </div>
              );
            }
            // pack: alternate left/right by position within the pack.
            const left: typeof seg.items = [];
            const right: typeof seg.items = [];
            seg.items.forEach((it, i) => (i % 2 === 0 ? left : right).push(it));
            return (
              <div
                key={`p-${sIdx}`}
                style={{ display: 'flex', gap: 12, marginBottom: 14 }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {left.map(({ row, flatIndex }) => (
                    <FeedCard
                      key={row.post_id}
                      row={row}
                      feedPost={feedPosts[flatIndex]}
                      posts={feedPosts}
                      flatIndex={flatIndex}
                      isAutoplayActive={activeIndices.has(flatIndex)}
                      badge={row.derived_format as 'clip' | 'video'}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {right.map(({ row, flatIndex }) => (
                    <FeedCard
                      key={row.post_id}
                      row={row}
                      feedPost={feedPosts[flatIndex]}
                      posts={feedPosts}
                      flatIndex={flatIndex}
                      isAutoplayActive={activeIndices.has(flatIndex)}
                      badge={row.derived_format as 'clip' | 'video'}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px 0',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: '3px solid rgba(0,0,0,0.08)',
              borderTopColor: '#F7931E',
              animation: 'hub-mixed-spin 0.9s linear infinite',
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

export default HubMixedGrid;
