import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VideoCardMenu } from '@/components/videos-tab/VideoCardMenu';
import { useWatchActions } from '../context/WatchActionsContext';
import { Pin } from '../proshop/Pin';
import { haptic } from '@/utils/haptics';
import { ExpandableCaption } from '@/components/posts/ExpandableCaption';
import { attachHlsToTile } from '@/hooks/useTileVideoPlayer';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { MediaRuntime } from '@/media/runtime';
import type { RegisterMediaFn } from '@/media';

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

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export interface AutoplayVideoCardProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  userId?: string;
  /** Card corner radius in px. Defaults to 12. */
  borderRadius?: number;
  /** Phase WatchSpotlight-C: runtime-managed autoplay. Required for autoplay. */
  registerMedia: RegisterMediaFn;
  /** Stable id to register against MediaRuntime. Namespaced (watch-rail-/watch-hero-). */
  mediaId: string;
  /** Runtime says this card is the spotlight winner. */
  isPlaying: boolean;
  /** Runtime IO says this card is currently a visible candidate (≥ start
   * threshold). Drives lazy HLS attach BEFORE isPlaying to break the
   * no_src ↔ isPlaying deadlock. */
  isVisibleCandidate?: boolean;
  /** Tie-breaker for runtime selection (lower = higher priority). */
  sortIndex?: number;
}

function AutoplayVideoCardInner({
  post,
  index,
  allPosts,
  userId,
  borderRadius = 12,
  registerMedia,
  mediaId,
  isPlaying,
  isVisibleCandidate = false,
  sortIndex,
}: AutoplayVideoCardProps) {
  const navigate = useNavigate();
  const { openActions } = useWatchActions();
  const longPressTimer = useRef<number | null>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [videoVisible, setVideoVisible] = useState(false);

  const firstVideo = post.mediaItems.find((m) => m.type === 'video');
  const thumbnail = firstVideo?.thumbnailUrl || firstVideo?.imageUrl || '';
  const hlsUrl = (firstVideo as any)?.hlsUrl as string | undefined;
  const mp4Url = (firstVideo as any)?.videoUrl || (firstVideo as any)?.mp4Url;
  const duration = firstVideo?.duration ?? 0;
  const courseName = (post as any).courseName ?? null;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  // Register the persistent <video> element with MediaRuntime via ref callback.
  // Mirrors WatchTile (Stage B). The element is always mounted (cheap — preload="none")
  // so the runtime has a real <video> to call play()/pause() on before HLS is attached.
  const videoRefCallback = useCallback(
    (el: HTMLVideoElement | null) => {
      videoElRef.current = el;
      if (el && tileRef.current) {
        registerMedia({
          id: mediaId,
          element: el,
          observeTarget: tileRef.current,
          sortIndex: sortIndex ?? index,
          isCandidate: !!(hlsUrl || mp4Url),
        });
      } else {
        registerMedia({ id: mediaId, element: null });
      }
    },
    [registerMedia, mediaId, sortIndex, index, hlsUrl, mp4Url],
  );

  // Attach HLS when this card is a visible candidate (lazy attach to break
  // no_src ↔ isPlaying deadlock); demote-to-pool on the way out. Runtime
  // owns play/pause via safePlay — we only set src and nudge.
  useEffect(() => {
    const v = videoElRef.current;
    if (!v) return;
    if (!isVisibleCandidate && !isPlaying) return;
    if (!hlsUrl && !mp4Url) return;

    let cancelled = false;

    const onReady = () => {
      if (cancelled) return;
      setVideoVisible(true);
      MediaRuntime.nudge();
    };

    if (hlsUrl) {
      attachHlsToTile({ hlsUrl, mp4Fallback: mp4Url, video: v, onReady })
        .then((hls) => {
          if (cancelled) {
            if (hls && hlsUrl && HLSPoolManager.isPooled(hlsUrl)) {
              try { HLSPoolManager.demote(hlsUrl, hls); } catch {}
            } else {
              try { hls?.destroy?.(); } catch {}
            }
            return;
          }
          hlsRef.current = hls;
        })
        .catch(() => {});
    } else if (mp4Url) {
      v.src = mp4Url;
      v.addEventListener('canplay', onReady, { once: true });
    }

    return () => {
      cancelled = true;
      setVideoVisible(false);
      const hls = hlsRef.current;
      if (hls) {
        if (hlsUrl && HLSPoolManager.isPooled(hlsUrl)) {
          try { HLSPoolManager.demote(hlsUrl, hls); } catch {}
        } else {
          try { hls.stopLoad?.(); } catch {}
          try { hls.detachMedia?.(); } catch {}
          try { hls.destroy?.(); } catch {}
        }
        hlsRef.current = null;
      }
      if (v) {
        if (!hlsUrl) {
          v.removeAttribute('src');
          try { v.load(); } catch {}
        }
      }
    };
  }, [isVisibleCandidate, isPlaying, hlsUrl, mp4Url]);

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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/video/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption || 'Check out this video', url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied');
      } catch { /* unavailable */ }
    }
  };

  return (
    <article>

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
          borderRadius,
          overflow: 'hidden',
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
        aria-label={`Play video by ${post.displayName}`}
      >
        <div ref={tileRef} style={{ position: 'absolute', inset: 0 }}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: videoVisible ? 0 : 1,
                transition: 'opacity 200ms ease',
              }}
            />
          ) : null}

          {(hlsUrl || mp4Url) ? (
            <video
              ref={videoRefCallback}
              muted
              loop
              playsInline
              preload="none"
              // @ts-ignore webkit-only attribute
              webkit-playsinline=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                opacity: videoVisible ? 1 : 0,
                transition: 'opacity 150ms ease',
                zIndex: 1,
              }}
            />
          ) : null}
        </div>

        {courseName ? (
          <div style={{ position: 'absolute', top: 8, left: 8, maxWidth: 'calc(100% - 80px)', zIndex: 2 }}>
            <Pin variant="dark" icon={<span style={{ fontSize: 9 }}>📍</span>}>
              {courseName}
            </Pin>
          </div>
        ) : null}

        {duration > 0 ? (
          <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
            <Pin variant="dark">{formatHMS(duration)}</Pin>
          </div>
        ) : null}
      </button>

      <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'flex-start', padding: '0 16px' }}>
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
          <ExpandableCaption
            lines={2}
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.3,
              color: '#0F172A',
              letterSpacing: '-0.01em',
            }}
          >
            {post.caption || `${post.displayName} on Clbhouz`}
          </ExpandableCaption>
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
            color: 'rgba(15,23,42,0.55)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Heart size={14} />
            <span style={{ fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {formatCompact(post.likeCount)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageCircle size={14} />
            <span style={{ fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {formatCompact(post.commentCount)}
            </span>
          </div>
        </div>

        <div style={{ flexShrink: 0, marginRight: -8 }}>
          <VideoCardMenu postId={post.id} userId={userId} onShare={handleShare} />
        </div>
      </div>
    </article>
  );
}

const AutoplayVideoCard = memo(AutoplayVideoCardInner);
export default AutoplayVideoCard;
