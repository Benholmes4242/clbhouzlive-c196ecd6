import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, EyeOff, Link as LinkIcon, Ban, Pencil, Trash2, ExternalLink } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { useBlockActions } from '@/hooks/useBlockActions';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { MORE_SHEET_Z } from '@/lib/zLayers';
import type { FeedPost } from '@/components/media-system/types/media';

/**
 * Shared non-owner "more options" sheet used by:
 *  - Clubhouse.tsx (in-feed activePost)
 *  - PostsTabContent.tsx (profile posts tab)
 *  - FullscreenFeedOverlay.tsx (immersive viewer)
 *
 * Presentation shell mirrors CommentsSheetV2 exactly: framer-motion scrim +
 * panel portalled to document.body, inline zIndex from zLayers so it stacks
 * ABOVE FullscreenFeedOverlay (MORE_SHEET_Z > FS_OVERLAY_Z).
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
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { blockUser, loading } = useBlockActions({ currentUserId: currentUserId ?? '' });
  const openPostStudioForEdit = usePostStudioStore((s) => s.openPostStudioForEdit);
  const { deletePost } = usePostDeletion();

  const authorId = post?.userId ?? null;
  const isEditorial = post ? EDITORIAL_POST_TYPES.has(post.postType ?? '') : false;
  const isOwnPost = !!(currentUserId && authorId && authorId === currentUserId);
  const canBlock = !!currentUserId && !!authorId && !isOwnPost && !isEditorial;
  const canReport = !!currentUserId && !!post && !isOwnPost && !isEditorial;
  const sourceReviewId = post?.review?.reviewId ?? null;
  const reviewCourseId = post?.review?.courseId ?? null;
  const isReviewDerived = !!sourceReviewId;
  const canOwnerEdit = isOwnPost && !isEditorial && !!post;

  const usernameLabel = post?.username ? `@${post.username}` : (post?.displayName ?? 'this user');

  // Body scroll lock while open — mirrors CommentsSheetV2.
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  const handleBlockConfirm = async () => {
    if (!authorId) return;
    const ok = await blockUser(authorId);
    setConfirmOpen(false);
    if (ok) {
      onOpenChange(false);
      onAfterBlock?.();
    }
  };

  const handleEdit = () => {
    if (!post) return;
    onOpenChange(false);
    openPostStudioForEdit({ postId: post.id });
  };

  const handleManageReview = () => {
    if (!reviewCourseId) return;
    onOpenChange(false);
    navigate(`/courses/${reviewCourseId}/rate`);
  };

  const handleConfirmDelete = async () => {
    if (!post || isDeleting) return;
    // Close FIRST (both the inner AlertDialog and the outer drawer) so
    // Radix/vaul run their exit cycles before invalidation evicts the post
    // and unmounts this host. Otherwise pointer-events:none leaks onto <body>.
    setIsDeleting(true);
    setConfirmDeleteOpen(false);
    onOpenChange(false);
    await new Promise((r) => setTimeout(r, 300));
    try {
      const actorType = post.actorType === 'business' ? 'business' : 'personal';
      await deletePost(post.id, actorType, post.actorId);
    } catch {
      // Failure surfaces via the deletion hook's own toast.
    } finally {
      setIsDeleting(false);
    }
  };

  const sheet = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: MORE_SHEET_Z,
              background: 'rgba(0,0,0,0.40)',
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.velocity.y > 300 || info.offset.y > 120) onOpenChange(false);
            }}
            style={{
              position: 'fixed',
              insetInline: 0,
              bottom: 0,
              zIndex: MORE_SHEET_Z + 1,
              width: '100%',
              background: '#F8FAFC',
              borderRadius: '20px 20px 0 0',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Grabber */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.14)' }} />
            </div>

            <div style={{ padding: '4px 0 0' }}>
              {canReport && (
                <button onClick={onReport} style={rowStyle}>
                  <Flag className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                  <span style={rowLabelStyle}>Report this post</span>
                </button>
              )}
              {!isOwnPost && (
                <button onClick={onNotInterested} style={rowStyle}>
                  <EyeOff className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                  <span style={rowLabelStyle}>Not interested</span>
                </button>
              )}
              <button
                onClick={onCopyLink}
                style={{
                  ...rowStyle,
                  borderBottom: (canBlock || canOwnerEdit) ? rowStyle.borderBottom : 'none',
                }}
              >
                <LinkIcon className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                <span style={rowLabelStyle}>Copy link</span>
              </button>
              {canOwnerEdit && isReviewDerived && (
                <button
                  onClick={handleManageReview}
                  disabled={!reviewCourseId}
                  style={{ ...rowStyle, borderBottom: 'none', opacity: reviewCourseId ? 1 : 0.5 }}
                >
                  <ExternalLink className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                  <span style={rowLabelStyle}>Manage review</span>
                </button>
              )}
              {canOwnerEdit && !isReviewDerived && (
                <>
                  <button onClick={handleEdit} style={rowStyle}>
                    <Pencil className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
                    <span style={rowLabelStyle}>Edit post</span>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteOpen(true)}
                    style={{ ...rowStyle, borderBottom: 'none' }}
                  >
                    <Trash2 className="w-5 h-5" style={{ color: '#DC2626' }} />
                    <span style={{ ...rowLabelStyle, color: '#DC2626' }}>Delete post</span>
                  </button>
                </>
              )}
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
            <div style={{ minHeight: 16 }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const portalled = typeof window !== 'undefined' ? createPortal(sheet, document.body) : null;

  return (
    <>
      {portalled}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        {/* z overrides ensure the Block confirm (Radix Overlay + Content)
            present above the fullscreen viewer (FS_OVERLAY_Z = 200) and the
            MoreOptions sheet itself (MORE_SHEET_Z = 230). */}
        <AlertDialogContent
          className="z-[233]"
          overlayClassName="fixed inset-0 z-[232] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
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

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent
          className="z-[233]"
          overlayClassName="fixed inset-0 z-[232] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your post and all its media will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
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
  borderBottom: '0.5px solid rgba(255,255,255,0.10)',
  cursor: 'pointer',
  textAlign: 'left',
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#0F172A',
  fontWeight: 500,
};

export default MoreOptionsDrawer;
