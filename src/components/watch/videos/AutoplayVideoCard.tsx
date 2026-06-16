import { memo, useEffect, useRef, useState } from 'react';
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
  /** When true, mount a video and autoplay muted+looped. When false, thumbnail only. */
  active: boolean;
  /** Card corner radius in px. Defaults to 12. */
  borderRadius?: number;
  /** Horizontal padding (px) for the meta row under the thumbnail. Defaults to 16. */
  metaPadX?: number;
}

function AutoplayVideoCardInner({ post, index, allPosts, userId, active, borderRadius = 12, metaPadX = 16 }: AutoplayVideoCardProps) {
  const navigate = useNavigate();
  const { openActions } = useWatchActions();
  const longPressTimer = useRef<number | null>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  // Manage autoplay video layer based on `active`
  useEffect(() => {
    const tile = tileRef.current;
    if (!tile) return;

    let cancelled = false;

    if (active && (hlsUrl || mp4Url)) {
      const v = document.createElement('video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('muted', '');
      v.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;opacity:0;transition:opacity 150ms ease;z-index:1;';
      tile.appendChild(v);
      videoRef.current = v;

      const onReady = () => {
        if (cancelled) return;
        v.style.opacity = '1';
        setVideoVisible(true);
        v.play().catch(() => {});
      };

      if (hlsUrl) {
        attachHlsToTile({ hlsUrl, mp4Fallback: mp4Url, video: v, onReady })
          .then((hls) => {
            if (cancelled) {
              hls?.destroy?.();
              return;
            }
            hlsRef.current = hls;
          })
          .catch(() => {});
      } else if (mp4Url) {
        v.src = mp4Url;
        v.addEventListener('canplay', onReady, { once: true });
        v.play().catch(() => {});
      }
    }

    return () => {
      cancelled = true;
      setVideoVisible(false);
      const v = videoRef.current;
      if (v) {
        try { v.pause(); } catch {}
        v.removeAttribute('src');
        try { v.load(); } catch {}
        if (v.parentElement) v.parentElement.removeChild(v);
      }
      videoRef.current = null;
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, [active, hlsUrl, mp4Url]);

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

      <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'flex-start', padding: `0 ${metaPadX}px` }}>
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
              fontSize: 15,
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
              fontSize: 12.5,
              fontWeight: 500,
              color: 'rgba(15,23,42,0.55)',
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.displayName || post.username || 'Clbhouz'}
            {timeAgo ? <> · {timeAgo}</> : null}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 6,
              color: 'rgba(15,23,42,0.40)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Heart size={13} />
              <span style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {formatCompact(post.likeCount)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MessageCircle size={13} />
              <span style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {formatCompact(post.commentCount)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, marginRight: metaPadX === 0 ? 8 : -8, marginTop: 18 }}>
          <VideoCardMenu
            postId={post.id}
            userId={userId}
            onShare={handleShare}
            className={metaPadX === 0 ? '!mr-0' : undefined}
          />
        </div>
      </div>
    </article>
  );
}

const AutoplayVideoCard = memo(AutoplayVideoCardInner);
export default AutoplayVideoCard;
