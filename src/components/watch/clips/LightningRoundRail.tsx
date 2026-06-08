import { memo } from 'react';
import { useLightningRound } from './hooks/useLightningRound';
import type { ClipsMoodId } from './hooks/useClipsMood';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import WatchRailTile from '../WatchRailTile';

interface LightningRoundRailProps {
  userId: string | undefined;
  mood: ClipsMoodId;
}

/**
 * Lightning Round rail — clips ≤30 seconds. The For-You feed but capped at
 * 30s on the server so we keep personalisation + ranking intact. Hides on
 * empty (rare; means the user has no qualifying short content available).
 */
function LightningRoundRailInner({ userId, mood }: LightningRoundRailProps) {
  const { data: posts = [], isLoading } = useLightningRound(userId, mood);

  if (isLoading) return null;
  if (posts.length === 0) return null;

  return (
    <section>
      <SectionHeader
        kicker="Under 30 sec"
        title="Lightning round"
        sub="Bite-sized golf, bite-sized commitment"
      />
      <HRail>
        {posts.map((post, i) => (
          <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
            <WatchRailTile post={post} index={i} allPosts={posts} />
          </div>
        ))}
      </HRail>
    </section>
  );
}

export const LightningRoundRail = memo(LightningRoundRailInner);
export default LightningRoundRail;
