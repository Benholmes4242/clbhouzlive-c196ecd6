import { memo } from 'react';
import { useVideosContinueWatching } from './hooks/useVideosContinueWatching';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import { VideoRailTile } from './VideoRailTile';
import { useActiveActor } from '@/context/ActiveActorContext';

interface VideosContinueWatchingRailProps {
  userId: string | undefined;
}

/**
 * Continue Watching rail (long-form only). Hides if the user has no
 * in-progress long-form videos. Mood-independent — pickup behaviour shouldn't
 * silently disappear when filtering changes.
 */
function VideosContinueWatchingRailInner({ userId }: VideosContinueWatchingRailProps) {
  const { activeActor } = useActiveActor();
  const actor = activeActor ? { id: activeActor.id, type: activeActor.type } : null;
  const { data: posts = [], isLoading } = useVideosContinueWatching(userId, actor, 8);

  if (isLoading) return null;
  if (posts.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title="Continue watching"
        sub="Pick up where you left off"
      />
      <HRail>
        {posts.map((post, i) => {
          const progress =
            post.totalSeconds && post.totalSeconds > 0
              ? post.progressSeconds / post.totalSeconds
              : 0;
          return (
            <VideoRailTile
              key={post.id}
              post={post}
              index={i}
              allPosts={posts}
              width={280}
              progress={progress}
            />
          );
        })}
      </HRail>
    </section>
  );
}

export const VideosContinueWatchingRail = memo(VideosContinueWatchingRailInner);
export default VideosContinueWatchingRail;
