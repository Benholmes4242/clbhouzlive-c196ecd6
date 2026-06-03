import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import WatchSectionHeader from './WatchSectionHeader';
import AutoplayVideoCard from './videos/AutoplayVideoCard';
import CarouselRow from './videos/CarouselRow';

/**
 * "Latest videos" — 1 full-width hero (autoplays when in view) +
 * a horizontal peek carousel (active/centred card autoplays).
 * Max 2 concurrent videos (hero + 1 carousel).
 */
export default function LatestVideosRail() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroActive, setHeroActive] = useState(false);

  const { posts, isLoading } = useVideosFeed({ userId, filter: 'latest' });

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

  if (isLoading || posts.length === 0) {
    return (
      <div>
        <WatchSectionHeader
          eyebrow="Videos"
          title="Latest videos"
          sub="Tournament recaps, coaching, vlogs"
          onSeeAll={() => navigate('/watch/videos')}
          seeAllLabel="More videos"
        />
        <VideosFeedSkeleton />
      </div>
    );
  }

  const hero = posts[0];
  const carousel = posts.slice(1, 6);

  return (
    <div>
      <WatchSectionHeader
        eyebrow="Videos"
        title="Latest videos"
        sub="Tournament recaps, coaching, vlogs"
        onSeeAll={() => navigate('/watch/videos')}
        seeAllLabel="More videos"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div ref={heroRef}>
          <AutoplayVideoCard
            post={hero}
            index={0}
            allPosts={posts}
            userId={userId}
            active={heroActive}
          />
        </div>

        {carousel.length > 0 ? (
          <CarouselRow
            items={carousel}
            allPosts={posts}
            baseIndex={1}
            userId={userId}
          />
        ) : null}
      </div>
    </div>
  );
}
