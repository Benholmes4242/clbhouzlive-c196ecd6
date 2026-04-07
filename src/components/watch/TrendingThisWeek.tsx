import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from './hooks/useWatchFeed';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface TrendingThisWeekProps {
  enabled?: boolean;
}

/* ── Per-card autoplay tile ── */
function TrendingCard({
  post,
  index,
  allPosts,
}: {
  post: any;
  index: number;
  allPosts: any[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const media = post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const hlsUrl = media?.hlsUrl || '';

  // Per-card IntersectionObserver — autoplay once when 40% visible
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !hlsUrl || hasPlayed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          startAutoplay();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl, hasPlayed]);

  const startAutoplay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    video.muted = true;
    video.playsInline = true;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, maxBufferLength: 4 });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.play().catch(() => {});
    }

    setIsPlaying(true);

    video.onended = () => {
      setIsPlaying(false);
      setHasPlayed(true);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  const handleTap = () => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  };

  return (
    <div
      ref={cardRef}
      style={{
        flexShrink: 0,
        position: 'relative',
        width: 140,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '3/4',
      }}
      onClick={handleTap}
    >
      {/* Thumbnail */}
      <img
        src={thumb}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* Autoplay video layer */}
      {hlsUrl && (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Big rank number */}
      <div style={{
        position: 'absolute', bottom: -8, left: 8,
        fontSize: 56, fontWeight: 900,
        color: 'transparent',
        WebkitTextStroke: '1.5px rgba(255,255,255,0.45)',
        lineHeight: 1, letterSpacing: '-3px',
        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        fontFamily: 'Georgia, serif',
        pointerEvents: 'none',
      }}>
        {index + 1}
        </span>
      </div>

      {/* Likes */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          pointerEvents: 'none',
        }}
      >
        🧡 {post.likeCount}
      </div>

      {/* Glass play button — shown after autoplay finishes */}
      {hasPlayed && !isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid rgba(255,255,255,0.9)',
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              marginLeft: 2,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function TrendingThisWeek({ enabled = true }: TrendingThisWeekProps) {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const { posts, isLoading } = useWatchFeed({
    userId,
    filter: 'top',
    enabled: !!userId && enabled,
  });

  const topPosts = posts.slice(0, 5);

  // ── Loading skeleton ──
  if (isLoading) {
    const shimmerBase = {
      background: 'rgba(0,0,0,0.06)',
      backgroundImage:
        'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
      backgroundSize: '200% 100%',
    } as React.CSSProperties;

    return (
      <div style={{ background: '#F8FAFC' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 16px 10px',
          }}
        >
          <div
            style={{
              ...shimmerBase,
              width: 140,
              height: 12,
              borderRadius: 6,
              animation: 'clb-shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              ...shimmerBase,
              width: 52,
              height: 12,
              borderRadius: 6,
              animation: 'clb-shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                ...shimmerBase,
                flexShrink: 0,
                width: 140,
                aspectRatio: '3/4',
                borderRadius: 12,
                animation: `clb-shimmer ${1.5 + i * 0.15}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (topPosts.length === 0) return null;

  return (
    <div style={{ background: '#F8FAFC' }}>
      {/* Label row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#1a1a1a',
              letterSpacing: '-0.2px',
            }}
          >
            Hot right now
          </span>
        </div>
        <button
          onClick={() => navigate('/watch/clips')}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#F7931E',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          See all →
        </button>
      </div>

      {/* Horizontal scroll — ranked cards */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '0 16px 16px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {topPosts.map((post, i) => (
          <TrendingCard key={post.id} post={post} index={i} allPosts={topPosts} />
        ))}
      </div>
    </div>
  );
}
