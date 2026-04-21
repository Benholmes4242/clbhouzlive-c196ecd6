import { useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { ContinueWatchingPost } from './hooks/useContinueWatching';
import { useContinueWatching } from './hooks/useContinueWatching';
import WatchSectionHeader from './WatchSectionHeader';
import WatchSectionDivider from './WatchSectionDivider';

interface ContinueWatchingRailProps {
  userId: string | undefined;
}

/**
 * "Continue watching" rail — shows posts the user started but didn't finish.
 * Hides itself when there are no qualifying posts (new users, etc).
 *
 * Tapping a tile resumes the fullscreen viewer at the saved progress.
 */
export default function ContinueWatchingRail({ userId }: ContinueWatchingRailProps) {
  const { posts, isLoading } = useContinueWatching(userId, 10);

  if (!userId || isLoading || posts.length === 0) return null;

  return (
    <>
      <WatchSectionHeader eyebrow="Continue Watching" title="Pick up where you left off" />
      <div
        className="flex gap-3 overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          padding: '0 16px 16px',
          scrollSnapType: 'x mandatory',
        }}
      >
        {posts.map((post, i) => (
          <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
            <ContinueWatchingTile post={post} index={i} allPosts={posts} />
          </div>
        ))}
      </div>
      <WatchSectionDivider />
    </>
  );
}

function ContinueWatchingTile({
  post,
  index,
  allPosts,
}: {
  post: ContinueWatchingPost;
  index: number;
  allPosts: ContinueWatchingPost[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const media = post.mediaItems[0];
  const thumb = media?.thumbnailUrl || media?.imageUrl || '';
  const progressPct = post.totalSeconds > 0
    ? Math.min(100, Math.max(2, (post.progressSeconds / post.totalSeconds) * 100))
    : 0;

  const handleTap = () => {
    // Open fullscreen at the saved position. SnapVideoPlayer reads
    // `currentTime` from the data attribute set on the active card via
    // an effect; here we attach it via a simple custom event so the
    // viewer knows where to seek.
    useFullscreenFeedStore.getState().open(allPosts as any, index);
    // Hint: SnapVideoPlayer will pick up data-resume-seconds from the
    // active feed card if present. We dispatch a one-shot event the
    // overlay listens for.
    window.dispatchEvent(
      new CustomEvent('continue-watching:seek', {
        detail: { postId: post.id, seconds: post.progressSeconds },
      }),
    );
  };

  return (
    <div
      ref={cardRef}
      onClick={handleTap}
      style={{
        flexShrink: 0,
        position: 'relative',
        width: 200,
        aspectRatio: '3/4',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#0F172A',
      }}
    >
      <img
        src={thumb}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Resume play affordance */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '11px solid rgba(255,255,255,0.95)',
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            marginLeft: 3,
          }}
        />
      </div>

      {/* Creator handle */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 10,
          right: 10,
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.95)',
          textShadow: '0 1px 4px rgba(0,0,0,0.7)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        @{post.username || post.displayName}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(255,255,255,0.15)',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: '#FFFFFF',
          }}
        />
      </div>
    </div>
  );
}
