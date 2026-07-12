import { useEffect, useMemo, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { useClipsWallFeed, type ClipsV2Mood, type ClipsWallRow } from '../hooks/useClipsWallFeed';
import { segmentWall } from '../utils/segmentWall';
import { WallTile } from './WallTile';
import { WallWideCard } from './WallWideCard';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const spinKeyframes = `@keyframes clips-v2-spin { to { transform: rotate(360deg); } }`;

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
        borderRadius: 13,
        background: 'rgba(0,0,0,0.06)',
        marginBottom: 12,
      }}
    />
  );
}

export function ClipsWall({ mood }: { mood: ClipsV2Mood }) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } =
    useClipsWallFeed({ userId, mood });

  const rows: ClipsWallRow[] = useMemo(
    () => (data?.pages ?? []).flat() as ClipsWallRow[],
    [data],
  );
  const feedPosts = useMemo(() => toFeedPosts(rows as any[]), [rows]);
  const { activeIndices, railRef } = useWatchAutoplay({
    railId: 'clips-v2-wall',
    posts: feedPosts,
    maxActive: 3,
  });

  const segments = useMemo(() => segmentWall(rows), [rows]);

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

  if (isLoading) {
    return (
      <div style={{ padding: '12px 16px 30px', fontFamily: FONT_FAMILY }}>
        <style>{spinKeyframes}</style>
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
    );
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: FONT_FAMILY }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>No clips here yet</div>
        <div style={{ fontWeight: 500, fontSize: 12, color: '#64748B', marginTop: 4 }}>
          {mood !== 'for_you' ? 'Try another mood' : 'Check back soon'}
        </div>
      </div>
    );
  }

  return (
    <div ref={railRef} style={{ padding: '12px 16px 30px', fontFamily: FONT_FAMILY }}>
      <style>{spinKeyframes}</style>
      {segments.map((seg, sIdx) => {
        if (seg.kind === 'wide') {
          const { row, flatIndex } = seg.item;
          return (
            <div key={`w-${row.post_id}`} style={{ marginBottom: 12 }}>
              <WallWideCard
                row={row}
                post={feedPosts[flatIndex]}
                flatIndex={flatIndex}
                posts={feedPosts}
                isAutoplayActive={activeIndices.has(flatIndex)}
              />
            </div>
          );
        }
        // pack: split by position within the pack (even = left, odd = right)
        const left: typeof seg.items = [];
        const right: typeof seg.items = [];
        seg.items.forEach((it, i) => (i % 2 === 0 ? left : right).push(it));
        return (
          <div key={`p-${sIdx}`} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {left.map(({ row, flatIndex }) => (
                <WallTile
                  key={row.post_id}
                  row={row}
                  post={feedPosts[flatIndex]}
                  flatIndex={flatIndex}
                  posts={feedPosts}
                  isAutoplayActive={activeIndices.has(flatIndex)}
                />
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {right.map(({ row, flatIndex }) => (
                <WallTile
                  key={row.post_id}
                  row={row}
                  post={feedPosts[flatIndex]}
                  flatIndex={flatIndex}
                  posts={feedPosts}
                  isAutoplayActive={activeIndices.has(flatIndex)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: '3px solid rgba(0,0,0,0.08)',
              borderTopColor: '#F7931E',
              animation: 'clips-v2-spin 0.9s linear infinite',
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default ClipsWall;
