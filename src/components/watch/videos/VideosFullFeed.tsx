import { memo, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import VideoFeedCard from './VideoFeedCard';

interface VideosFullFeedProps {
  userId: string | undefined;
}

/**
 * Bottom vertical "More to watch" feed. Mood-independent — always shows the
 * full personalised long-form firehose. Reuses the existing useVideosFeed
 * hook (latest mode) so we inherit pagination + dedupe + search support.
 */
function VideosFullFeedInner({ userId }: VideosFullFeedProps) {
  const fetchGuard = useRef(false);
  const { ref: sentinelRef, inView } = useInView({ rootMargin: '400px' });

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useVideosFeed({ userId, filter: 'latest' });

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

  if (!isLoading && posts.length === 0) return null;

  return (
    <div style={{ paddingTop: 8, paddingBottom: 24 }}>
      {posts.map((post, i) => (
        <VideoFeedCard key={post.id} post={post} index={i} allPosts={posts} userId={userId} />
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
