import { memo } from 'react';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import WatchTile from '../WatchTile';
import { useQuickClipsRail } from './hooks/useQuickClipsRail';

interface VideosQuickClipsRailProps {
  userId: string | undefined;
}

/**
 * Single horizontal row of vertical 9:16 short-form clips dropped into the
 * long-form rhythm. Appears ONCE in the Videos rhythm. Self-hides when
 * fewer than 3 shorts are available so the row never reads as a hole.
 * Fullscreen open from a tile uses the CLIPS post set (different swipe
 * context from the long-form feed).
 */
function VideosQuickClipsRailInner({ userId }: VideosQuickClipsRailProps) {
  const { data: posts = [], isLoading } = useQuickClipsRail(userId, 8);
  if (!userId) return null;
  if (isLoading) return null;
  if (posts.length < 3) return null;

  return (
    <section>
      <SectionHeader paddingTop={20} title="Quick clips" sub="Short and sweet" />
      <HRail paddingBottom={10}>
        {posts.map((post, i) => (
          <div
            key={post.id}
            style={{
              width: 132,
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
            }}
          >
            <div
              style={{
                width: 132,
                aspectRatio: '9 / 16',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                background: 'hsl(var(--muted))',
              }}
            >
              <WatchTile post={post} index={i} allPosts={posts} />
            </div>
          </div>
        ))}
      </HRail>
    </section>
  );
}

export const VideosQuickClipsRail = memo(VideosQuickClipsRailInner);
export default VideosQuickClipsRail;
