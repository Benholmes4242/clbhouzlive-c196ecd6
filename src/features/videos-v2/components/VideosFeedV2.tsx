/**
 * VideosFeedV2 — infinite feed body for /watch/videos.
 *
 * Pending uploads integration replicates VideosFullFeed's semantics:
 *   - usePendingPostsForActor keyed to the active actor (business or
 *     personal), with the current feed's real post_ids passed in so the
 *     hook can drop entries once they've landed as real posts.
 *   - Filter to entries whose media includes at least one video kind
 *     (this is the videos surface — audio/photo-only pending posts
 *     surface elsewhere).
 * Reference (READ, do not import): src/components/watch/videos/VideosFullFeed.tsx.
 */
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { usePendingPostsForActor } from '@/uploads/usePendingPostsForActor';
import { PendingPostCard } from '@/components/posts-tab/PendingPostCard';
import { useWatchAutoplay } from '@/video/useWatchAutoplay';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import type { VideosSortId } from '../types';
import type { VideosV2CategoryId } from '../categories';
import { useVideosFeedV2, type VideosFeedV2Row } from '../hooks/useVideosFeedV2';
import { useInterruptClips } from '../hooks/useInterruptClips';
import { VideoFeedCard } from './VideoFeedCard';
import { ClipsInterruptShelf } from './ClipsInterruptShelf';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  sort: VideosSortId;
  category: VideosV2CategoryId | null;
}

function SkeletonCard() {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        className="clb-shimmer-light"
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
        }}
      />
      <div style={{ display: 'flex', gap: 9, marginTop: 8 }}>
        <div
          className="clb-shimmer-light"
          style={{
            width: 30,
            height: 30,
            borderRadius: '34%',
            background: 'rgba(0,0,0,0.06)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="clb-shimmer-light"
            style={{ height: 12, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}
          />
          <div
            className="clb-shimmer-light"
            style={{
              marginTop: 6,
              height: 10,
              width: '60%',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.06)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function VideosFeedV2({ sort, category }: Props) {
  const { user, loading: authLoading } = useSupabaseSession();
  const userId = user?.id;

  const {
    data,
    isLoading: fetching,
    isFetched,
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useVideosFeedV2({ userId, sort, category });
  // SETTLED IS NOT "NOT LOADING": the feed query is gated on userId.
  const isLoading = !isFetched || fetching;

  // Shared trending-clips pool for every interrupt shelf on the page.
  const { data: interruptClipsData } = useInterruptClips(userId);
  const interruptClips = interruptClipsData ?? [];

  const rows: VideosFeedV2Row[] = useMemo(() => {
    const pages = (data?.pages ?? []) as VideosFeedV2Row[][];
    const flat: VideosFeedV2Row[] = [];
    for (const p of pages) for (const r of p) flat.push(r);
    return flat;
  }, [data]);

  const feedPosts = useMemo(() => toFeedPosts(rows), [rows]);

  // Autoplay across the feed container. maxActive:3 - viewport fits ~2 tall
  // cards, so 2 slots were usually both held by visible cards and the entering
  // card still had to win a steal; a third slot guarantees the entering card
  // activates at the viewport edge.
  const { activeIndices, railRef } = useWatchAutoplay({
    railId: 'videos-v2-feed',
    posts: feedPosts,
    maxActive: 3,
  });

  // Pending uploads (video-kind only) — same semantics as VideosFullFeed.
  const { activeActor } = useActiveActor();
  const realPostIds = useMemo(() => rows.map((r) => r.post_id), [rows]);
  const pendingEntries = usePendingPostsForActor({
    authorActorType: activeActor?.type === 'business' ? 'business' : 'personal',
    authorActorId: activeActor?.id ?? userId ?? '',
    viewerActorType: activeActor?.type === 'business' ? 'business' : 'personal',
    viewerActorId: activeActor?.id ?? userId ?? '',
    realPostIds,
  });
  const visiblePending = useMemo(
    () => pendingEntries.filter((e) => e.media.some((m) => m.kind === 'video')),
    [pendingEntries],
  );

  // Infinite scroll sentinel.
  const fetchGuard = useRef(false);
  const { ref: sentinelRef, inView } = useInView({ rootMargin: '400px' });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      window.setTimeout(() => {
        fetchGuard.current = false;
      }, 200);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Empty state.
  // eslint-disable-next-line settled/no-not-loading-empty-check -- isLoading is derived as !isFetched || fetching above.
  const isEmpty = !isLoading && !authLoading && rows.length === 0 && visiblePending.length === 0;
  const nonDefault = sort !== 'latest' || category != null;

  return (
    <div style={{ fontFamily: FONT_FAMILY }}>
      {visiblePending.length > 0 && (
        <div style={{ padding: '12px 4px 0' }}>
          {visiblePending.map((p) => (
            <div key={p.jobId} style={{ marginBottom: 12 }}>
              <PendingPostCard entry={p} />
            </div>
          ))}
        </div>
      )}

      {(isLoading || authLoading) && rows.length === 0 ? (
        <div style={{ padding: '12px 4px 0' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            Couldn't load videos
          </div>
          <div style={{ marginTop: 6, fontWeight: 500, fontSize: 12, color: '#64748B' }}>
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
      ) : isEmpty ? (
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            No videos yet
          </div>
          <div
            style={{
              marginTop: 6,
              fontWeight: 500,
              fontSize: 12,
              color: '#64748B',
            }}
          >
            {nonDefault ? 'Try a different filter' : 'Check back soon'}
          </div>
        </div>
      ) : (
        <div ref={railRef} style={{ padding: '12px 4px 0' }}>
          {rows.map((r, i) => {
            const card = (
              <VideoFeedCard
                key={r.post_id}
                row={r}
                post={feedPosts[i]}
                index={i}
                posts={feedPosts}
                isAutoplayActive={activeIndices.has(i)}
              />
            );
            // Insert a clips interrupt shelf after flat index (6 + 12k) - 1
            // = 5 + 12k, i.e. after the 6th, 18th, 30th video. Gated on
            // having at least 7 loaded videos and a non-empty clips pool.
            // Shelves are NOT tiles of the feed rail: they carry no
            // data-watch-tile-index and never enter feedPosts.
            const shouldInsertShelf =
              rows.length >= 7 &&
              interruptClips.length > 0 &&
              i >= 5 &&
              (i - 5) % 12 === 0;
            if (!shouldInsertShelf) return card;
            const shelfIndex = (i - 5) / 12;
            return (
              <Fragment key={`${r.post_id}-with-shelf`}>
                {card}
                <ClipsInterruptShelf
                  clips={interruptClips}
                  shelfIndex={shelfIndex}
                />
              </Fragment>
            );
          })}

          <div ref={sentinelRef} style={{ height: 1 }} />

          {isFetchingNextPage && <SkeletonCard />}
        </div>
      )}
    </div>
  );
}

export default VideosFeedV2;
