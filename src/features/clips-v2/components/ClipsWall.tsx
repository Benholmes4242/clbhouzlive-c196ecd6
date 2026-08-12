import { useEffect, useMemo, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toFeedPosts, type HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { FeedCard, type FeedCardRow } from '@/components/feed-cards/FeedCard';
import { packColumns } from '@/components/feed-cards/packColumns';
import { useClipsWallFeed, type ClipsV2Mood, type ClipsWallRow } from '../hooks/useClipsWallFeed';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function SkeletonTile() {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        className="clb-shimmer-light"
        style={{
          width: '100%',
          aspectRatio: '9 / 14',
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

export function ClipsWall({ mood }: { mood: ClipsV2Mood }) {
  const { user, loading: authLoading } = useSupabaseSession();
  const userId = user?.id;
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading, isError, refetch } =
    useClipsWallFeed({ userId, mood });

  const rows: ClipsWallRow[] = useMemo(
    () => (data?.pages ?? []).flat() as ClipsWallRow[],
    [data],
  );
  const feedPosts = useMemo(() => toFeedPosts(rows as unknown as HubRpcRow[]), [rows]);
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
        creator_display_name: r.creator_display_name ?? null,

        like_count: Number(r.like_count ?? 0),
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

  if (isLoading || (authLoading && rows.length === 0)) {
    return (
      <div style={{ padding: '12px 4px 0', fontFamily: FONT_FAMILY }}>
        <div style={{ display: 'flex', gap: 4 }}>
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

  if (isError) {
    return (
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
              openedFrom="clips"
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
              openedFrom="clips"
              hideFormatBadge
              bareTile
            />
          ))}

        </div>
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage ? (
        <div style={{ display: 'flex', gap: 4, padding: '16px 4px 0' }}>
          <div style={{ flex: 1 }}>
            <SkeletonTile />
          </div>
          <div style={{ flex: 1 }}>
            <SkeletonTile />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ClipsWall;
