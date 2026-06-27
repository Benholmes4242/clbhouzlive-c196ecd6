import { memo, useEffect, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { useVideosFeed, type VideosFilter } from '@/components/videos-tab/hooks/useVideosFeed';
import { moodToCategory, type VideosMoodId } from './hooks/useVideosMood';
import CompactVideoRow from './CompactVideoRow';
import VideoLargeCard from './VideoLargeCard';
import { useVideosFollowingRail } from './hooks/useVideosFollowingRail';
import { VideosFollowingRail } from './VideosFollowingRail';
import { VideosSuggestedCreatorsRail } from './VideosSuggestedCreatorsRail';
import { VideosQuickClipsRail } from './VideosQuickClipsRail';
import type { FeedPost } from '@/components/media-system/types/media';

interface VideosFullFeedProps {
  userId: string | undefined;
  mood: VideosMoodId;
  searchQuery?: string;
}

type Segment =
  | { kind: 'large'; posts: FeedPost[]; startIndex: number }
  | { kind: 'list'; posts: FeedPost[]; startIndex: number }
  | { kind: 'rail' }
  | { kind: 'clips' };

/**
 * Rhythm: A=3 large, rail, 5 list, 4 large, 5 list, 5 large, 5 list, then ALL
 * remaining as large cards. Bands grow as you descend; rail appears once.
 */
function buildRhythm(posts: FeedPost[]): Segment[] {
  const seg: Segment[] = [];
  let i = 0;
  const take = (n: number) => {
    const start = i;
    const slice = posts.slice(i, i + n);
    i += slice.length;
    return { slice, start };
  };

  if (i < posts.length) {
    const { slice, start } = take(3);
    seg.push({ kind: 'large', posts: slice, startIndex: start });
  }
  seg.push({ kind: 'rail' });
  if (i < posts.length) {
    const { slice, start } = take(5);
    seg.push({ kind: 'list', posts: slice, startIndex: start });
  }
  seg.push({ kind: 'clips' });
  if (i < posts.length) {
    const { slice, start } = take(4);
    seg.push({ kind: 'large', posts: slice, startIndex: start });
  }
  if (i < posts.length) {
    const { slice, start } = take(5);
    seg.push({ kind: 'list', posts: slice, startIndex: start });
  }
  if (i < posts.length) {
    const { slice, start } = take(5);
    seg.push({ kind: 'large', posts: slice, startIndex: start });
  }
  if (i < posts.length) {
    const { slice, start } = take(5);
    seg.push({ kind: 'list', posts: slice, startIndex: start });
  }
  while (i < posts.length) {
    const { slice, start } = take(6);
    seg.push({ kind: 'large', posts: slice, startIndex: start });
  }
  return seg;
}

/**
 * Top rail wrapper — shows "From creators you follow" if non-empty,
 * otherwise falls back to "Suggested creators". Rendered exactly once,
 * after the first band on the default for_you feed.
 */
function VideosTopRail({ userId }: { userId: string | undefined }) {
  const { data: following = [], isLoading } = useVideosFollowingRail(userId, 8);
  if (isLoading) return null;
  if (following.length > 0) return <VideosFollowingRail userId={userId} />;
  return <VideosSuggestedCreatorsRail userId={userId} />;
}

function VideosFullFeedInner({ userId, mood, searchQuery }: VideosFullFeedProps) {
  const fetchGuard = useRef(false);
  const { ref: sentinelRef, inView } = useInView({ rootMargin: '400px' });

  const category = moodToCategory(mood);
  const filter: VideosFilter = mood === 'friends' ? 'following' : 'latest';

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useVideosFeed({ userId, filter, category, searchQuery });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !fetchGuard.current) {
      fetchGuard.current = true;
      fetchNextPage();
      window.setTimeout(() => { fetchGuard.current = false; }, 200);
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const useRhythm = !searchQuery && mood === 'for_you';
  const segments = useMemo(() => (useRhythm ? buildRhythm(posts) : []), [useRhythm, posts]);

  const renderVideoFeedBody = () => {
    if (isLoading && posts.length === 0) {
      return (
        <div style={{ padding: '24px 16px', display: 'flex', justifyContent: 'center' }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(15,23,42,0.45)' }} />
        </div>
      );
    }

    if (isError && posts.length === 0) {
      return (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(15,23,42,0.6)', marginBottom: 12 }}>
            Couldn't load videos right now.
          </p>
          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              background: '#0F172A',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    if (!isLoading && posts.length === 0) {
      if (searchQuery) {
        return (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
              No videos match "{searchQuery}".
            </p>
          </div>
        );
      }
      if (mood === 'for_you') return null;
      return (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
            No videos here yet.
          </p>
        </div>
      );
    }

    if (useRhythm) {
      return (
        <div style={{ padding: '12px 0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {segments.map((seg, sIdx) => {
            if (seg.kind === 'rail') {
              return <VideosTopRail key={`rail-${sIdx}`} userId={userId} />;
            }
            if (seg.kind === 'clips') {
              return (
                <div key={`clips-${sIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <VideosQuickClipsRail userId={userId} />
                </div>
              );
            }
            if (seg.kind === 'large') {
              return (
                <div
                  key={`large-${seg.startIndex}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  {seg.posts.map((post, i) => (
                    <VideoLargeCard
                      key={post.id}
                      post={post}
                      index={seg.startIndex + i}
                      allPosts={posts}
                    />
                  ))}
                </div>
              );
            }
            return (
              <div
                key={`list-${seg.startIndex}`}
                style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 13 }}
              >
                {seg.posts.map((post, i) => (
                  <CompactVideoRow
                    key={post.id}
                    post={post}
                    index={seg.startIndex + i}
                    allPosts={posts}
                  />
                ))}
              </div>
            );
          })}

          <div ref={sentinelRef} style={{ height: 1 }} />

          {isFetchingNextPage && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(15,23,42,0.45)' }} />
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ padding: '12px 0 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 13 }}>
          {posts.map((post, i) => (
            <CompactVideoRow key={post.id} post={post} index={i} allPosts={posts} />
          ))}
        </div>

        <div ref={sentinelRef} style={{ height: 1 }} />

        {isFetchingNextPage && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(15,23,42,0.45)' }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {renderVideoFeedBody()}
    </>
  );
}

export const VideosFullFeed = memo(VideosFullFeedInner);
export default VideosFullFeed;
