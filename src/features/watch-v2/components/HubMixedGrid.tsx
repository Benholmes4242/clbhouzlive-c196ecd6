import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHubMixedGrid, type MixedGridRow } from '../hooks/useHubMixedGrid';
import { toFeedPosts } from '../utils/toFeedPost';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { packColumns } from '@/components/feed-cards/packColumns';
import { FeedCard } from '@/components/feed-cards/FeedCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function SkeletonTile({ aspect }: { aspect: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        className="clb-shimmer-light"
        style={{
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
      <div
        className="clb-shimmer-light"
        style={{
          height: 12.5,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
          marginTop: 6,
        }}
      />
      <div
        className="clb-shimmer-light"
        style={{
          height: 11,
          width: '55%',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
          marginTop: 2,
        }}
      />
    </div>
  );
}

export function HubMixedGrid({
  filter = 'all',
  children,
}: {
  filter?: string;
  children?: ReactNode;
} = {}) {
  const { user, loading: authLoading } = useSupabaseSession();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
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
  const feedPosts = useMemo(() => toFeedPosts(rows), [rows]);
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
      <SectionHeader
        role="section"
        kicker="EVERYTHING"
        title="Keep browsing"
        sub="Clips and videos, mixed"
        paddingX={16}
      />

      {children}

      <div style={{ height: 16 }} />

      {isLoading || (authLoading && rows.length === 0) ? (
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
      ) : isError ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: FONT_FAMILY }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            Couldn't load clips
          </div>
          <div style={{ fontWeight: 500, fontSize: 12, color: '#64748B', marginTop: 4 }}>
            Check your connection and try again.
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              marginTop: 12,
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              background: '#0F172A',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
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
              bareTile
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
              bareTile
              />
            ))}

          </div>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage ? (
        <div style={{ display: 'flex', gap: 4, padding: '16px 4px 0' }}>
          <div style={{ flex: 1 }}>
            <SkeletonTile aspect="9 / 14" />
          </div>
          <div style={{ flex: 1 }}>
            <SkeletonTile aspect="16 / 9" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default HubMixedGrid;
