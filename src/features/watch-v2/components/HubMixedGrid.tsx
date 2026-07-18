import { useEffect, useMemo, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubMixedGrid, type MixedGridRow } from '../hooks/useHubMixedGrid';
import { toFeedPosts } from '../utils/toFeedPost';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { packColumns } from '@/components/feed-cards/packColumns';
import { FeedCard } from '@/components/feed-cards/FeedCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const spinKeyframes = `@keyframes hub-mixed-spin { to { transform: rotate(360deg); } }`;

function SkeletonTile({ aspect }: { aspect: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
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

  const rows: MixedGridRow[] = (data?.pages ?? []).flat() as MixedGridRow[];
  const feedPosts = useMemo(() => toFeedPosts(rows as any[]), [rows]);
  const { activeIndices, railRef } = useWatchAutoplay({
    railId: 'hub-mixed-grid',
    posts: feedPosts,
    maxActive: 3,
  });

  // Height-balanced packing — data-watch-tile-index remains the FLAT index.
  const packed = packColumns(rows, (r) => {
    const w = Number(r?.width) || 0;
    const h = Number(r?.height) || 0;
    return w > 0 && h > 0 && w > h ? 16 / 9 : 9 / 14;
  });

  return (
    <section style={{ fontFamily: FONT_FAMILY }}>
      <style>{spinKeyframes}</style>
      <SectionHeader
        role="section"
        kicker="EVERYTHING"
        title="Keep browsing"
        sub="Clips and videos, mixed"
        paddingX={16}
      />

      {isLoading ? (
        <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
          <div style={{ flex: 1 }}>
            <SkeletonTile aspect="9 / 14" />
            <SkeletonTile aspect="16 / 9" />
          </div>
          <div style={{ flex: 1 }}>
            <SkeletonTile aspect="16 / 9" />
            <SkeletonTile aspect="9 / 14" />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            padding: '40px 16px',
            textAlign: 'center',
          }}
        >
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
        <div ref={railRef} style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
          <div style={{ flex: 1 }}>
            {packed.left.map(({ item, flatIndex: i }) => (
              <FeedCard
                key={item.post_id}
                row={item}
                feedPost={feedPosts[i]}
                posts={feedPosts}
                flatIndex={i}
                isAutoplayActive={activeIndices.has(i)}
                openedFrom="watch"
                hideFormatBadge
              />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            {packed.right.map(({ item, flatIndex: i }) => (
              <FeedCard
                key={item.post_id}
                row={item}
                feedPost={feedPosts[i]}
                posts={feedPosts}
                flatIndex={i}
                isAutoplayActive={activeIndices.has(i)}
                openedFrom="watch"
                hideFormatBadge
              />
            ))}

          </div>
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
