import { memo, useEffect, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { useVideosFeed, type VideosFilter } from '@/components/videos-tab/hooks/useVideosFeed';
import { moodToCategory, type VideosMoodId } from './hooks/useVideosMood';
import CompactVideoRow from './CompactVideoRow';
import VideoHeroCard from './VideoHeroCard';
import VideoGridCard from './VideoGridCard';
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
  | { kind: 'spotlight'; post: FeedPost; index: number; eyebrow?: string | null }
  | { kind: 'grid'; posts: FeedPost[]; startIndex: number }
  | { kind: 'clips' };

/**
 * 2-up magazine grid backbone, broken up by full-width spotlight cards
 * and the portrait clips rail. Spotlight → 2 grid rows → (spotlight|clips,
 * alternating) → 2 grid rows → … repeating.
 */
function buildRhythm(posts: FeedPost[]): Segment[] {
  const seg: Segment[] = [];
  let i = 0;
  let breakCount = 0;
  const GRID_ROWS_PER_BLOCK = 2;

  if (i < posts.length) {
    seg.push({ kind: 'spotlight', post: posts[i], index: i, eyebrow: 'FEATURED' });
    i += 1;
  }

  while (i < posts.length) {
    for (let r = 0; r < GRID_ROWS_PER_BLOCK && i < posts.length; r++) {
      const start = i;
      const slice = posts.slice(i, i + 2);
      i += slice.length;
      seg.push({ kind: 'grid', posts: slice, startIndex: start });
    }
    if (i >= posts.length) break;

    if (breakCount % 2 === 0) {
      seg.push({ kind: 'spotlight', post: posts[i], index: i, eyebrow: null });
      i += 1;
    } else {
      seg.push({ kind: 'clips' });
    }
    breakCount += 1;
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
            if (seg.kind === 'spotlight') {
              return (
                <VideoHeroCard
                  key={`spot-${seg.index}`}
                  post={seg.post}
                  index={seg.index}
                  allPosts={posts}
                  eyebrow={seg.eyebrow}
                />
              );
            }
            if (seg.kind === 'clips') {
              return <VideosQuickClipsRail key={`clips-${sIdx}`} userId={userId} />;
            }
            return (
              <div
                key={`grid-${seg.startIndex}`}
                style={{ display: 'flex', gap: 12, padding: '0 16px' }}
              >
                {seg.posts.map((post, i) => (
                  <VideoGridCard
                    key={post.id}
                    post={post}
                    index={seg.startIndex + i}
                    allPosts={posts}
                  />
                ))}
                {seg.posts.length === 1 && <div style={{ flex: 1 }} />}
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
