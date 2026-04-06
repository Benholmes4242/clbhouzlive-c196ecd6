import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchTile from './WatchTile';
import { attachHlsToTile } from '@/hooks/useTileVideoPlayer';

interface TrendingThisWeekProps {
  enabled?: boolean;
}

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

  // Find the first landscape video (width > height) for the hero slot
  const landscapeIndex = topPosts.findIndex(post => {
    const media = post.mediaItems[0];
    return media && media.width > 0 && media.height > 0 && media.width > media.height;
  });
  const heroIndex = landscapeIndex !== -1 ? landscapeIndex : 0;
  const heroPost = topPosts[heroIndex];
  const stripPosts = topPosts.filter((_, i) => i !== heroIndex).slice(0, 3);

  // ── Dedicated trending autoplay ──
  const heroRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const hlsRefs = useRef<(any | null)[]>([null, null]);

  useEffect(() => {
    const conn = (navigator as any).connection;
    const ect = conn?.effectiveType ?? '4g';
    if (ect === '2g' || ect === 'slow-2g') return;
    if (topPosts.length === 0) return;

    const videos: HTMLVideoElement[] = [0, 1].map(() => {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.style.cssText = [
        'position:absolute', 'inset:0', 'width:100%', 'height:100%',
        'object-fit:cover', 'pointer-events:none', 'z-index:1',
        'opacity:0', 'transition:opacity 250ms ease',
      ].join(';');
      return v;
    });
    videoRefs.current = videos;

    const attach = async (
      slot: number,
      containerEl: HTMLDivElement | null,
      post: (typeof topPosts)[0] | undefined,
    ) => {
      if (!containerEl || !post) return;
      const hlsUrl = post.mediaItems?.[0]?.hlsUrl;
      if (!hlsUrl) return;

      const video = videos[slot];
      containerEl.appendChild(video);

      const onCanPlay = () => { video.style.opacity = '1'; };
      video.addEventListener('canplay', onCanPlay, { once: true });

      try {
        const hls = await attachHlsToTile({ hlsUrl, video });
        hlsRefs.current[slot] = hls;
      } catch { /* silent */ }
    };

    const heroPostTarget = topPosts[heroIndex];
    const middleStripPost = stripPosts[1];

    // Observe hero
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          heroObserver.disconnect();
          attach(0, heroRef.current, heroPostTarget);
        }
      },
      { threshold: 0.5 },
    );
    if (heroRef.current) heroObserver.observe(heroRef.current);

    // Observe middle strip tile
    const middleObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          middleObserver.disconnect();
          attach(1, middleRef.current, middleStripPost);
        }
      },
      { threshold: 0.5 },
    );
    if (middleRef.current) middleObserver.observe(middleRef.current);

    return () => {
      heroObserver.disconnect();
      middleObserver.disconnect();
      videos.forEach((v, slot) => {
        v.pause();
        if (v.parentElement) v.parentElement.removeChild(v);
        hlsRefs.current[slot]?.destroy();
        hlsRefs.current[slot] = null;
      });
      videoRefs.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topPosts.length]);

  // ── Loading skeleton ──
  if (isLoading) {
    const shimmerBase = {
      background: 'rgba(0,0,0,0.06)',
      backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
      backgroundSize: '200% 100%',
    } as React.CSSProperties;

    return (
      <div style={{ background: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 10px' }}>
          <div style={{ ...shimmerBase, width: 140, height: 12, borderRadius: 6, animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
          <div style={{ ...shimmerBase, width: 52, height: 12, borderRadius: 6, animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ ...shimmerBase, width: '100%', aspectRatio: '16/9', animation: 'clb-shimmer 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...shimmerBase, flex: 1, aspectRatio: '4/5', animation: `clb-shimmer ${1.5 + i * 0.15}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (topPosts.length === 0) return null;

  return (
    <div>
      {/* ── Label row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 8px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          color: '#F7931E', textTransform: 'uppercase',
        }}>
          ⛳ Trending this week
        </div>
        <button
          onClick={() => navigate('/watch/clips')}
          style={{
            fontSize: 12, fontWeight: 600, color: '#F7931E',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          See all →
        </button>
      </div>

      {/* ── Hero — full-bleed 16:9 ── */}
      <div
        ref={heroRef}
        style={{
          position: 'relative', width: '100%', aspectRatio: '16/9',
          overflow: 'hidden', cursor: 'pointer', marginBottom: 4,
        }}
        data-watch-index={0}
      >
        <WatchTile post={heroPost} index={0} allPosts={topPosts} />
        {/* Gradient */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.05) 45%, transparent 70%)',
        }} />
        {/* Bottom row: likes + duration */}
        <div style={{
          position: 'absolute', bottom: 12, left: 14, right: 14,
          display: 'flex', alignItems: 'center', pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            🧡 {heroPost.likeCount}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 5, padding: '2px 7px',
            fontSize: 11, fontWeight: 600, color: '#fff',
          }}>
            {heroPost.mediaItems[0]?.duration
              ? `${Math.floor(heroPost.mediaItems[0].duration / 60)}:${String(Math.floor(heroPost.mediaItems[0].duration % 60)).padStart(2, '0')}`
              : ''}
          </span>
        </div>
      </div>

      {/* ── Strip — 3 tiles, full-bleed, 4px gap ── */}
      <div style={{ display: 'flex', gap: 4 }}>
        {stripPosts.map((post, i) => (
          <div
            key={post.id}
            ref={i === 1 ? middleRef : undefined}
            style={{
              flex: 1, aspectRatio: '4/5', overflow: 'hidden', position: 'relative', cursor: 'pointer',
            }}
            data-watch-index={i + 1}
          >
            <WatchTile post={post} index={i + 1} allPosts={topPosts} />
            {/* Rank badge — skip for first strip tile (i===0) */}
            {i > 0 && (
              <div style={{
                position: 'absolute', top: 7, left: 7, pointerEvents: 'none',
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: '#fff',
              }}>
                {i + 2}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
