import { useEffect, useMemo, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { FeedCard, type FeedCardRow } from '@/components/feed-cards/FeedCard';
import { packColumns } from '@/components/feed-cards/packColumns';
import { useClipsWallFeed, type ClipsV2Mood, type ClipsWallRow } from '../hooks/useClipsWallFeed';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const spinKeyframes = `@keyframes clips-v2-spin { to { transform: rotate(360deg); } }`;

function SkeletonTile() {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          width: '100%',
          aspectRatio: '9 / 14',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
    </div>
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

  // Every clips-wall row is a clip; synthesize the FeedCardRow the shared
  // FeedCard reads.
  const cardRows: FeedCardRow[] = useMemo(
    () =>
      rows.map((r) => ({
        post_id: r.post_id,
        post_content: r.post_content ?? null,
        derived_format: 'clip',
        poster_url: r.poster_url ?? null,
        duration_seconds: r.duration_seconds ?? null,
        creator_username: r.creator_username ?? null,
        like_count: Number((r as any).like_count ?? 0),
        course_name: r.course_name ?? null,
        width: r.width ?? null,
        height: r.height ?? null,
      })),
    [rows],
  );

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
      <div style={{ padding: '12px 16px 0', fontFamily: FONT_FAMILY }}>
        <style>{spinKeyframes}</style>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <SkeletonTile />
            <SkeletonTile />
          </div>
          <div style={{ flex: 1 }}>
            <SkeletonTile />
            <SkeletonTile />
          </div>
        </div>
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

  const packed = packColumns(cardRows, (r) => {
    const w = Number(r?.width) || 0;
    const h = Number(r?.height) || 0;
    return w > 0 && h > 0 && w > h ? 16 / 9 : 9 / 14;
  });

  return (
    <div style={{ padding: '12px 0 0', fontFamily: FONT_FAMILY }}>
      <style>{spinKeyframes}</style>
      <div ref={railRef} style={{ display: 'flex', gap: 12, padding: '0 16px' }}>
        <div style={{ flex: 1 }}>
          {packed.left.map(({ item, flatIndex: i }) => (
            <FeedCard
              key={item.post_id}
              row={item}
              feedPost={feedPosts[i]}
              posts={feedPosts}
              flatIndex={i}
              isAutoplayActive={activeIndices.has(i)}
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
            />
          ))}
        </div>
      </div>

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
