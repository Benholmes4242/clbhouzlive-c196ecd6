/**
 * CommentsSheetV2 — the ONE conversation-cards sheet for posts, top-ten cards,
 * and editorial cards. Fetches via useCommentsV2 (RPC-only writes); realtime
 * merges via useCommentsRealtimeV2.
 *
 * Design: light canvas #F8FAFC, amber eyebrow "CLBHOUZ CHAT", conversation
 * cards on white with hairline borders. Keyboard-aware via useKeyboardHeight.
 */
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from '@/lib/toast';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { useKeyboardHeight } from '@/hooks/messaging/useKeyboardHeight';
import type { ActiveActor } from '@/types/actor';

import { useCommentsV2, type TargetType, type CommentV2 } from './hooks/useCommentsV2';
import { useCommentsRealtimeV2 } from './hooks/useCommentsRealtimeV2';
import { CommentCard } from './components/CommentCard';
import { CommentComposer } from './components/CommentComposer';
import { CommentActionSheetV2 } from './components/CommentActionSheetV2';
import { ReportCommentSheetV2 } from './components/ReportCommentSheetV2';

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

const CANVAS = '#F8FAFC';
const INK = '#1F2428';
const SECONDARY = '#8A9099';
const MUTED = '#AEB4BC';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(0,0,0,0.07)';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetType: TargetType;
  targetId: string;
  targetSecondaryId?: string | null;
  /** Deep-link: scroll to + briefly highlight this comment on open. */
  initialCommentId?: string | null;
}

function CommentsSheetV2Inner({
  isOpen, onClose, targetType, targetId, targetSecondaryId, initialCommentId,
}: Props) {
  const { user } = useSupabaseSession();
  const kb = useKeyboardHeight();

  const {
    threads, totalCount, isLoading,
    fetchNextPage, hasNextPage, isFetchingNextPage,
    addComment, editComment, deleteComment, toggleLike, hideComment, reportComment,
  } = useCommentsV2({ targetType, targetId, targetSecondaryId, enabled: isOpen });

  useCommentsRealtimeV2(targetType, targetId, isOpen);

  const [replyingTo, setReplyingTo] = useState<{ id: string; displayName: string } | null>(null);
  const [editing, setEditing] = useState<CommentV2 | null>(null);
  const [editText, setEditText] = useState('');
  const [actionTarget, setActionTarget] = useState<CommentV2 | null>(null);
  const [reportTarget, setReportTarget] = useState<CommentV2 | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommentV2 | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [confirmDeleteWithReplies, setConfirmDeleteWithReplies] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const registerRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }, []);

  // Body scroll lock while open.
  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  // Reset composer/context on close.
  useEffect(() => {
    if (!isOpen) {
      setReplyingTo(null); setEditing(null); setEditText('');
      setActionTarget(null); setReportTarget(null); setDeleteTarget(null);
      setHighlightedId(null); setConfirmDeleteWithReplies(false);
    }
  }, [isOpen]);

  // Deep-link scroll + highlight. Loads earlier pages if the comment isn't
  // in the initial payload yet.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (!isOpen) { deepLinkHandled.current = false; return; }
    if (!initialCommentId || isLoading || deepLinkHandled.current) return;

    const flat = threads.flatMap(t => [t, ...t.replies]);
    const found = flat.find(c => c.id === initialCommentId);
    if (!found && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      return; // rerun after page appends
    }
    if (!found) return;

    deepLinkHandled.current = true;
    setHighlightedId(initialCommentId);
    requestAnimationFrame(() => {
      rowRefs.current.get(initialCommentId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const t = setTimeout(() => setHighlightedId(null), 1400);
    return () => clearTimeout(t);
  }, [isOpen, initialCommentId, isLoading, threads, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite loader — bottom sentinel triggers "earlier" pages (newest-first).
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const s = sentinelRef.current;
    const r = scrollRef.current;
    if (!s || !r || !hasNextPage || isFetchingNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) fetchNextPage();
    }, { root: r, rootMargin: '300px' });
    io.observe(s);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handlers
  const onReply = useCallback((c: CommentV2) => {
    setReplyingTo({ id: c.id, displayName: c.display_name });
  }, []);
  const onLike = useCallback((id: string) => { toggleLike.mutate(id); }, [toggleLike]);

  const onMore = useCallback((c: CommentV2) => setActionTarget(c), []);
  const onCopy = useCallback((c: CommentV2) => {
    if (c.content) {
      navigator.clipboard.writeText(c.content)
        .then(() => toast.success('Copied'))
        .catch(() => toast.error('Could not copy'));
    }
  }, []);
  const beginEdit = useCallback((c: CommentV2) => {
    setEditing(c); setEditText(c.content ?? '');
  }, []);
  const saveEdit = useCallback(async () => {
    if (!editing) return;
    try {
      await editComment.mutateAsync({ id: editing.id, content: editText });
      toast.success('Comment updated');
      setEditing(null); setEditText('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    }
  }, [editing, editText, editComment]);
  const beginDelete = useCallback((c: CommentV2) => {
    setDeleteTarget(c);
    setConfirmDeleteWithReplies(c.reply_count > 0);
  }, []);
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteComment.mutateAsync({ id: deleteTarget.id, replyCount: deleteTarget.reply_count });
      toast.success('Comment deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteComment]);

  const onSubmit = useCallback(async (input: {
    content?: string; mediaUrl?: string; mediaType?: string; actor: ActiveActor;
  }) => {
    try {
      await addComment.mutateAsync({
        content: input.content,
        parentId: replyingTo?.id ?? null,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        actorType: input.actor.type,
        actorId: input.actor.id,
      });
      setReplyingTo(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to post comment');
    }
  }, [addComment, replyingTo]);

  // ── Render ──
  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[12002] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[12003] w-full md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-[560px] flex flex-col"
            style={{
              background: CANVAS,
              borderRadius: '20px 20px 0 0',
              height: '75dvh',
              maxHeight: '75dvh',
              paddingBottom: kb > 0 ? kb : 0,
              transition: 'padding-bottom 120ms ease-out',
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.14)' }} />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-3 shrink-0">
              <div>
                <div
                  style={{
                    fontSize: '8.5px',
                    fontWeight: 800,
                    color: AMBER,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  COMMENTS
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, letterSpacing: '-0.01em' }}>
                  {totalCount} {totalCount === 1 ? 'comment' : 'comments'}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-0 cursor-pointer"
                aria-label="Close"
              >
                <X size={18} style={{ color: SECONDARY }} />
              </button>
            </div>

            {/* Scroll area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch', padding: '4px 12px 16px' }}
            >
              {isLoading ? (
                <SkeletonCards />
              ) : threads.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-3">
                  {threads.map((t) => (
                    <CommentCard
                      key={t.id}
                      comment={t}
                      currentUserId={user?.id ?? null}
                      registerRef={registerRef}
                      highlightedId={highlightedId}
                      onReply={onReply}
                      onLike={onLike}
                      onMore={onMore}
                      onClose={onClose}
                    />
                  ))}
                  {hasNextPage && (
                    <button
                      ref={(el) => { sentinelRef.current = (el as unknown as HTMLDivElement | null); }}
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="mt-1 mx-auto py-2 px-3 bg-transparent border-0 cursor-pointer"
                      style={{ fontSize: 12, fontWeight: 700, color: AMBER, letterSpacing: '0.06em' }}
                    >
                      {isFetchingNextPage ? 'Loading…' : 'VIEW EARLIER COMMENTS'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Composer */}
            <CommentComposer
              replyingTo={replyingTo}
              onClearReply={() => setReplyingTo(null)}
              onSubmit={onSubmit as any}
              isSubmitting={addComment.isPending}
            />
          </motion.div>

          {/* Action sheet */}
          <CommentActionSheetV2
            open={!!actionTarget}
            onClose={() => setActionTarget(null)}
            isOwn={!!actionTarget && actionTarget.user_id === user?.id}
            onEdit={() => actionTarget && beginEdit(actionTarget)}
            onDelete={() => actionTarget && beginDelete(actionTarget)}
            onCopy={() => actionTarget && onCopy(actionTarget)}
            onReport={() => setReportTarget(actionTarget)}
            onHide={async () => {
              if (!actionTarget) return;
              try {
                await hideComment.mutateAsync(actionTarget.id);
                toast.success('Comment hidden');
              } catch (e: any) {
                toast.error(e?.message ?? 'Failed to hide');
              }
            }}
          />

          {/* Report */}
          <ReportCommentSheetV2
            open={!!reportTarget}
            onClose={() => setReportTarget(null)}
            onSubmit={async (reason, details) => {
              if (!reportTarget) return;
              try {
                await reportComment.mutateAsync({ id: reportTarget.id, reason, details });
              } catch (e: any) {
                toast.error(e?.message ?? 'Failed to submit report');
              }
            }}
          />

          {/* Edit dialog */}
          <AlertDialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setEditText(''); } }}>
            <AlertDialogContent className="z-[12008]">
              <AlertDialogHeader>
                <AlertDialogTitle>Edit comment</AlertDialogTitle>
                <AlertDialogDescription>Your comment will be marked as edited.</AlertDialogDescription>
              </AlertDialogHeader>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full outline-none"
                style={{
                  minHeight: 96, padding: 12, borderRadius: 12,
                  border: `1px solid ${HAIRLINE}`, background: '#FFFFFF',
                  fontSize: 14, color: INK, resize: 'vertical',
                }}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={saveEdit}
                  disabled={editComment.isPending || !editText.trim()}
                  style={{ background: AMBER, color: '#FFFFFF' }}
                >
                  {editComment.isPending ? 'Saving…' : 'Save'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete confirm */}
          <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
            <AlertDialogContent className="z-[12008]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmDeleteWithReplies
                    ? `This comment has ${deleteTarget?.reply_count ?? 0} ${(deleteTarget?.reply_count ?? 0) === 1 ? 'reply' : 'replies'} that will also be removed. This can't be undone.`
                    : "This can't be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  disabled={deleteComment.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteComment.isPending ? 'Deleting…' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: '#FFFFFF', border: `1px solid ${HAIRLINE}`,
            borderRadius: 16, padding: 14,
          }}
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-[34%] shrink-0 clb-shimmer-light" style={{ background: 'rgba(15,23,42,0.06)' }} />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-4 w-24 rounded clb-shimmer-light" style={{ background: 'rgba(15,23,42,0.06)' }} />
              <div className="h-4 w-[85%] rounded clb-shimmer-light" style={{ background: 'rgba(15,23,42,0.06)' }} />
              <div className="h-4 w-[55%] rounded clb-shimmer-light" style={{ background: 'rgba(15,23,42,0.06)' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8" style={{ minHeight: 220 }}>
      <div className="flex gap-3 text-4xl">
        <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>⛳</span>
        <span className="inline-block animate-bounce" style={{ animationDelay: '180ms' }}>🏌️</span>
        <span className="inline-block animate-bounce" style={{ animationDelay: '360ms' }}>💬</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p style={{ fontSize: 16, fontWeight: 700, color: INK }}>No comments yet</p>
        <p style={{ fontSize: 13, color: MUTED }}>Be the first to drop your thoughts</p>
      </div>
    </div>
  );
}

export const CommentsSheetV2 = memo(CommentsSheetV2Inner);
export default CommentsSheetV2;
