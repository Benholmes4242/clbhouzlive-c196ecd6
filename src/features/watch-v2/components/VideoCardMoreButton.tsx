import { MoreHorizontal } from 'lucide-react';
import { toast } from '@/lib/toast';
import type { FeedPost } from '@/components/media-system/types/media';
import { MoreOptionsDrawer } from '@/components/clubhouse/MoreOptionsDrawer';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

/**
 * Shared 3-dot overflow for full-width video cards (Watch hub "New videos"
 * rail + /watch/videos subpage). Opens the same MoreOptionsDrawer used by
 * FullscreenFeedOverlay via the same useClubhouseShare hook — do NOT fork.
 */
export function VideoCardMoreButton({ post }: { post: FeedPost }) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const {
    handleReport,
    handleNotInterested,
    moreOptionsOpen,
    setMoreOptionsOpen,
  } = useClubhouseShare(userId);

  return (
    <>
      <button
        type="button"
        aria-label="More options"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMoreOptionsOpen(true);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
          margin: -6,
          flexShrink: 0,
          color: '#64748B',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <MoreHorizontal size={18} strokeWidth={2} />
      </button>
      {moreOptionsOpen && (
        <MoreOptionsDrawer
          open={moreOptionsOpen}
          onOpenChange={setMoreOptionsOpen}
          post={post}
          currentUserId={userId}
          onReport={() => handleReport(post)}
          onNotInterested={() => handleNotInterested(post)}
          onCopyLink={() => {
            navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
            toast.success('Link copied');
            setMoreOptionsOpen(false);
          }}
        />
      )}
    </>
  );
}
