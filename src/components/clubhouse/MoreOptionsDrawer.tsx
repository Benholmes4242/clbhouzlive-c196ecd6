import React, { useState } from 'react';
import { Flag, EyeOff, Link as LinkIcon, Ban } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBlockActions } from '@/hooks/useBlockActions';
import type { FeedPost } from '@/components/media-system/types/media';

/**
 * Shared non-owner "more options" drawer used by:
 *  - Clubhouse.tsx (in-feed activePost)
 *  - PostsTabContent.tsx (profile posts tab)
 *  - FullscreenFeedOverlay.tsx (immersive viewer)
 *
 * Editorial / system cards (postType === 'course_of_week_card' and other
 * non-UGC card types) hide Report + Block since they don't map to a real
 * post_reports row and there is no user to block.
 */

// Post types that are NOT user-generated content. Report/Block must be
// hidden for these because their id is a card id, not a post id.
const EDITORIAL_POST_TYPES = new Set([
  'course_of_week_card',
  'tournament_live',
  'pga_card',
  'history_card',
  'debate_card',
  'review_of_week_card',
]);

export interface MoreOptionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: FeedPost | null;
  currentUserId: string | undefined;
  onReport: () => void;
  onNotInterested: () => void;
  onCopyLink: () => void;
  /** Optional: called after a successful block (e.g. to advance past the author). */
  onAfterBlock?: () => void;
}

export const MoreOptionsDrawer: React.FC<MoreOptionsDrawerProps> = ({
  open,
  onOpenChange,
  post,
  currentUserId,
  onReport,
  onNotInterested,
  onCopyLink,
  onAfterBlock,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { blockUser, loading } = useBlockActions({ currentUserId: currentUserId ?? '' });

  const authorId = post?.userId ?? null;
  const isEditorial = post ? EDITORIAL_POST_TYPES.has(post.postType ?? '') : false;
  const isOwnPost = !!(currentUserId && authorId && authorId === currentUserId);
  const canBlock = !!currentUserId && !!authorId && !isOwnPost && !isEditorial;
  const canReport = !!currentUserId && !!post && !isOwnPost && !isEditorial;

  const usernameLabel = post?.username ? `@${post.username}` : (post?.displayName ?? 'this user');

  const handleBlockConfirm = async () => {
    if (!authorId) return;
    const ok = await blockUser(authorId);
    setConfirmOpen(false);
    if (ok) {
      onOpenChange(false);
      onAfterBlock?.();
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="rounded-t-[20px]"
          style={{ background: '#F8FAFC', border: 'none' }}
        >
          <div style={{ padding: '4px 0 0' }}>
            {canReport && (
              <button
                onClick={onReport}
                style={rowStyle}
              >
                <Flag className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                <span style={rowLabelStyle}>Report this post</span>
              </button>
            )}
            <button onClick={onNotInterested} style={rowStyle}>
              <EyeOff className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
              <span style={rowLabelStyle}>Not interested</span>
            </button>
            <button
              onClick={onCopyLink}
              style={{ ...rowStyle, borderBottom: canBlock ? rowStyle.borderBottom : 'none' }}
            >
              <LinkIcon className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
              <span style={rowLabelStyle}>Copy link</span>
            </button>
            {canBlock && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={loading}
                style={{ ...rowStyle, borderBottom: 'none', opacity: loading ? 0.6 : 1 }}
              >
                <Ban className="w-5 h-5" style={{ color: '#DC2626' }} />
                <span style={{ ...rowLabelStyle, color: '#DC2626' }}>
                  Block {usernameLabel}
                </span>
              </button>
            )}
          </div>
          <div className="h-[env(safe-area-inset-bottom,0px)]" style={{ minHeight: 16 }} />
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {usernameLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to see your posts or contact you, and their content
              will be hidden from your feed, comments, and messages. You can unblock
              them from Settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockConfirm}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Blocking…' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const rowStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 20px',
  background: 'transparent',
  border: 'none',
  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
  cursor: 'pointer',
  textAlign: 'left',
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#0F172A',
  fontWeight: 500,
};

export default MoreOptionsDrawer;
