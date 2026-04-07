import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from './hooks/useWatchFeed';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

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
        <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ ...shimmerBase, flexShrink: 0, width: 140, aspectRatio: '3/4', borderRadius: 12, animation: `clb-shimmer ${1.5 + i * 0.15}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (topPosts.length === 0) return null;

  return (
    <div style={{ background: '#F8FAFC' }}>
      {/* Label row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.2px' }}>
            Hot right now
          </span>
        </div>
        <button
          onClick={() => navigate('/watch/clips')}
          style={{ fontSize: 12, fontWeight: 600, color: '#F7931E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          See all →
        </button>
      </div>

      {/* Horizontal scroll — ranked cards */}
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto',
        padding: '0 16px 16px', scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {topPosts.map((post, i) => {
          const media = post.mediaItems[0];
          const thumb = media?.thumbnailUrl || media?.imageUrl || '';
          const duration = media?.duration
            ? `${Math.floor(media.duration / 60)}:${String(Math.floor(media.duration % 60)).padStart(2, '0')}`
            : '';
          return (
            <div
              key={post.id}
              style={{
                flexShrink: 0, position: 'relative',
                width: 140, borderRadius: 12, overflow: 'hidden',
                cursor: 'pointer', aspectRatio: '3/4',
              }}
              onClick={() => {
                useFullscreenFeedStore.getState().open(topPosts, i);
              }}
            >
              {/* Thumbnail */}
              <img
                src={thumb}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Gradient */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)',
              }} />
              {/* Big rank number */}
              <div style={{
                position: 'absolute', bottom: -8, left: 8,
                fontSize: 56, fontWeight: 900,
                color: 'rgba(255,255,255,0.92)',
                lineHeight: 1, letterSpacing: '-3px',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                fontFamily: 'Georgia, serif',
                pointerEvents: 'none',
              }}>
                {i + 1}
              </div>
              {/* Duration badge */}
              {duration && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 4, padding: '2px 6px',
                  fontSize: 10, fontWeight: 600, color: '#fff',
                }}>
                  {duration}
                </div>
              )}
              {/* Likes */}
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
                pointerEvents: 'none',
              }}>
                🧡 {post.likeCount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
