import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import AutoplayVideoCard from './videos/AutoplayVideoCard';
import CompactVideoRow from './videos/CompactVideoRow';
import { VideosMark } from './proshop/SectionMarks';
import { useWatchReveal } from './WatchRevealContext';
import { useFirstVisibleDecoded } from './shared/useFirstVisibleDecoded';

const VISIBLE_COUNT = 3; // hero + 2 compact rows on-screen at rest

/**
 * "Latest videos" — 1 full-width hero (autoplays when in view) +
 * a vertical compact list of subsequent videos.
 */
export default function LatestVideosRail() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroActive, setHeroActive] = useState(false);

  const { posts, isLoading, hasResolved } = useVideosFeed({ userId, filter: 'latest' });

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroActive(entry.intersectionRatio >= 0.5),
      { threshold: [0, 0.25, 0.5, 0.75] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [posts.length]);

  const { settled: firstVisibleDecoded, onDecoded } = useFirstVisibleDecoded(posts.length, VISIBLE_COUNT);
  const isEmpty = hasResolved && posts.length === 0;
  const revealed = useWatchReveal(
    'latest-videos',
    hasResolved && (isEmpty || firstVisibleDecoded),
  );

  const skeleton = (
    <div>
      <SectionHeader
        role="rail"
        title="Latest videos"
        action={{ label: 'More videos', onClick: () => navigate('/watch/videos') }}
        paddingTop={6}
        paddingX={16}
      />
      <VideosFeedSkeleton />
    </div>
  );

  if (!hasResolved || isLoading) return skeleton;
  if (posts.length === 0) return null;

  const hero = posts[0];
  const rest = posts.slice(1, 6);

  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        style={{ pointerEvents: revealed ? 'auto' : 'none' }}
      >
        <SectionHeader
          role="rail"
          title="Latest videos"
          action={{ label: 'More videos', onClick: () => navigate('/watch/videos') }}
          paddingTop={6}
          paddingX={16}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div ref={heroRef} style={{ padding: '0 16px' }}>
            <AutoplayVideoCard
              post={hero}
              index={0}
              allPosts={posts}
              userId={userId}
              active={heroActive}
              borderRadius={6}
              onDecoded={onDecoded}
              debugId="latest-videos#0"
            />
          </div>

          {rest.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 16px 0' }}>
              {rest.map((post, i) => (
                <CompactVideoRow
                  key={post.id}
                  post={post}
                  index={i + 1}
                  allPosts={posts}
                  onDecoded={i < VISIBLE_COUNT - 1 ? onDecoded : undefined}
                  debugId={`latest-videos#${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {!revealed && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {skeleton}
        </div>
      )}
    </div>
  );
}

