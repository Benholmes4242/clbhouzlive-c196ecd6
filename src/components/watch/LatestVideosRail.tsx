import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import { useMediaAutoplay } from '@/media';
import WatchSectionHeader from './WatchSectionHeader';
import AutoplayVideoCard from './videos/AutoplayVideoCard';
import CarouselRow from './videos/CarouselRow';

/**
 * "Latest videos" — 1 full-width hero (autoplays when in view) +
 * a horizontal peek carousel (active/centred card autoplays).
 *
 * Phase WatchSpotlight-C: hero + carousel tiles all register against the
 * single global 'watch' surface (cap=1) so they compete for one spotlight
 * with the grid and Quick Clips rail. Hero candidacy is naturally IO-driven
 * (full-bleed) — only the carousel needs explicit setCandidateState (handled
 * inside CarouselRow).
 */
export default function LatestVideosRail() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const heroRef = useRef<HTMLDivElement>(null);

  const { posts, isLoading } = useVideosFeed({ userId, filter: 'latest' });

  const { registerMedia, playingIds, visibleIds } = useMediaAutoplay({
    mode: 'grid',
    surface: 'watch',
    startThreshold: 0.5,
    stopThreshold: 0.25,
  });

  if (isLoading || posts.length === 0) {
    return (
      <div>
        <WatchSectionHeader
          paddingTop={16}
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
  const heroMediaId = `watch-rail-${hero.id}`;

  return (
    <div>

      <WatchSectionHeader
        paddingTop={16}
        title="Latest videos"
        sub="Tournament recaps, coaching, vlogs"
        onSeeAll={() => navigate('/watch/videos')}
        seeAllLabel="More videos"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div ref={heroRef}>
          <AutoplayVideoCard
            post={hero}
            index={0}
            allPosts={posts}
            userId={userId}
            borderRadius={0}
            mediaId={heroMediaId}
            registerMedia={registerMedia}
            isPlaying={playingIds.has(heroMediaId)}
            sortIndex={0}
          />
        </div>

        {carousel.length > 0 ? (
          <CarouselRow
            items={carousel}
            allPosts={posts}
            baseIndex={1}
            userId={userId}
            registerMedia={registerMedia}
            playingIds={playingIds}
          />
        ) : null}
      </div>
    </div>
  );
}
