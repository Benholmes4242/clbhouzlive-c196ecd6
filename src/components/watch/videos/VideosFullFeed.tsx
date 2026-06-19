import { memo, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { useVideosFeed, type VideosFilter } from '@/components/videos-tab/hooks/useVideosFeed';
import { moodToCategory, type VideosMoodId } from './hooks/useVideosMood';
import CompactVideoRow from './CompactVideoRow';

interface VideosFullFeedProps {
  userId: string | undefined;
  mood: VideosMoodId;
  searchQuery?: string;
}

/**
 * Bottom vertical "More to watch" feed. Mood-aware: category moods filter by
 * p_category, Friends switches to following mode, For you is the unfiltered
 * latest firehose. Reuses useVideosFeed so we inherit pagination + dedupe.
 */
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

  return (
    <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
      {posts.map((post, i) => (
        <CompactVideoRow key={post.id} post={post} index={i} allPosts={posts} />
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(15,23,42,0.45)' }} />
        </div>
      )}
    </div>
  );
}

export const VideosFullFeed = memo(VideosFullFeedInner);
export default VideosFullFeed;
