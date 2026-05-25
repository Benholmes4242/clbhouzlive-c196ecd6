/**
 * HomeWatchRail — Phase 2.
 * Four-tile bridge to /watch. Sources trending shorts via useWatchFeed (filter=top).
 */
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from '@/components/watch/hooks/useWatchFeed';
import { useViewedPostIds } from '@/components/watch/hooks/useViewedPostIds';
import WatchRailTile from '@/components/watch/WatchRailTile';

const AMBER = '#F7931E';
const INK_FAINT = 'rgba(15,23,42,0.55)';

export function HomeWatchRail() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { posts, isLoading } = useWatchFeed({ userId, filter: 'top', enabled: !!userId });
  const { data: viewedPostIds } = useViewedPostIds();

  const top4 = [...(posts ?? [])]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 4);

  const Eyebrow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Watch · Trending This Week
        </span>
      </div>
      <button
        onClick={() => navigate('/watch')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 12,
          fontWeight: 700,
          color: AMBER,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        View Watch
        <ChevronRight size={14} strokeWidth={2.4} />
      </button>
    </div>
  );

  if (!isLoading && top4.length === 0) {
    return (
      <section>
        {Eyebrow}
        <div style={{ padding: '0 16px', fontSize: 12, color: INK_FAINT, fontWeight: 500 }}>
          No trending content yet — check back later.
        </div>
      </section>
    );
  }

  // Compute tile width for 4-up grid: viewport - 32 (page padding) - 3*8 (gaps) / 4
  const tileWidth = `calc((100vw - 32px - 24px) / 4)`;

  return (
    <section>
      {Eyebrow}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px',
        }}
      >
        {top4.map((post, i) => (
          <WatchRailTile
            key={post.id}
            post={post}
            index={i}
            allPosts={top4}
            viewedPostIds={viewedPostIds}
            width="100%"
          />
        ))}
      </div>
    </section>
  );
}

export default HomeWatchRail;
