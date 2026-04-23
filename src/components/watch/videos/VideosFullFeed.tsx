import { memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { Loader2, Play, MoreVertical, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useWatchActions } from '../context/WatchActionsContext';
import { Pin } from '../proshop/Pin';
import { haptic } from '@/utils/haptics';

interface VideosFullFeedProps {
  userId: string | undefined;
}

function formatHMS(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

interface VideoFeedCardProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
}

function VideoFeedCardInner({ post, index, allPosts }: VideoFeedCardProps) {
  const navigate = useNavigate();
  const { openActions } = useWatchActions();
  const longPressTimer = useRef<number | null>(null);

  const firstVideo = post.mediaItems.find((m) => m.type === 'video');
  const thumbnail = firstVideo?.thumbnailUrl || firstVideo?.imageUrl || '';
  const duration = firstVideo?.duration ?? 0;
  const courseName = (post as any).courseName ?? null;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  const handleTap = () => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  };

  const startPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      haptic('medium');
      openActions(post);
      longPressTimer.current = null;
    }, 450);
  };
  const cancelPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <article style={{ padding: '0 16px 18px' }}>
      <button
        type="button"
        onClick={handleTap}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 10,
          overflow: 'hidden',
          background: '#0F172A',
          border: 'none',
          padding: 0,
        }}
        aria-label={`Play video by ${post.displayName}`}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {courseName ? (
          <div style={{ position: 'absolute', top: 8, left: 8, maxWidth: 'calc(100% - 80px)' }}>
            <Pin variant="dark" icon={<span style={{ fontSize: 9 }}>📍</span>}>
              {courseName}
            </Pin>
          </div>
        ) : null}

        {duration > 0 ? (
          <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
            <Pin variant="dark" icon={<Clock size={10} />}>{formatHMS(duration)}</Pin>
          </div>
        ) : null}

        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 44, height: 44,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Play size={18} fill="white" stroke="white" strokeWidth={1} style={{ marginLeft: 2 }} />
        </div>
      </button>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'flex-start' }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.userId}`); }}
          style={{ background: 'none', border: 'none', padding: 0, flexShrink: 0 }}
          aria-label={`View ${post.displayName}'s profile`}
        >
          <SquircleAvatar
            src={post.avatarUrl}
            alt={post.displayName}
            userId={post.userId}
            size="sm"
            hideRing
          />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.3,
              color: '#0F172A',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              letterSpacing: '-0.01em',
            }}
          >
            {post.caption || `${post.displayName} on Clbhouz`}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(15,23,42,0.55)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.displayName || post.username || 'Clbhouz'}
            {timeAgo ? <> · {timeAgo}</> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openActions(post); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 0 4px 4px',
            cursor: 'pointer',
            color: 'rgba(15,23,42,0.55)',
            flexShrink: 0,
          }}
          aria-label="More options"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </article>
  );
}

const VideoFeedCard = memo(VideoFeedCardInner);

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
        <VideoFeedCard key={post.id} post={post} index={i} allPosts={posts} />
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
