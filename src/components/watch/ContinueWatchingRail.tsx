import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { ContinueWatchingPost } from './hooks/useContinueWatching';
import { useContinueWatching } from './hooks/useContinueWatching';
import WatchSectionHeader from './WatchSectionHeader';
// WatchSectionDivider removed in Phase 4 — divider ownership now lives in
// the page composition (UnifiedWatchFeed); rails no longer render their own.
import { HRail } from './proshop/HRail';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
      <WatchSectionHeader eyebrow="Continue" title="Continue watching" sub="Pick up where you left off" />
      <HRail>
        {posts.map((post, i) => (
          <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
            <ContinueWatchingTile post={post} index={i} allPosts={posts} />
          </div>
        ))}
      </HRail>
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
      onClick={handleTap}
      style={{
        flexShrink: 0,
        position: 'relative',
        width: 200,
        aspectRatio: '3/4',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'transparent',
      }}
    >
      <img
        src={thumb}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Bottom gradient for legibility (matches WatchRailTile) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)',
          pointerEvents: 'none',
        }}
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
          background: 'rgba(0,0,0,0.6)',
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

      {/* Creator chip — canonical glass-pill+avatar (matches WatchRailTile) */}
      {(post.displayName || post.username) && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 999,
            padding: '2px 8px 2px 2px',
            maxWidth: 'calc(100% - 16px)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <SquircleAvatar
              src={post.avatarUrl}
              alt={post.displayName || post.username || ''}
              size={18}
              hideRing
            />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 130,
            }}
          >
            {post.displayName || post.username}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 5,
          background: 'rgba(255,255,255,0.28)',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: '#F7931E',
          }}
        />
      </div>
    </div>
  );
}
