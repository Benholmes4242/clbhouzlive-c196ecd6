/**
 * CommentsPage - Orchestrator shell for the comments bottom sheet.
 * All UI sub-components are extracted into src/components/comments/.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { cn } from '@/lib/utils';
import { useCommentsWithReplies, CommentWithReplies, CommentReply } from '@/hooks/useCommentsWithReplies';
import { useHiddenComments } from '@/hooks/useHiddenComments';
import { useCaddiePick } from '@/hooks/useCaddiePick';
import { useCommentsRealtime } from '@/hooks/useCommentsRealtime';
import { useCommentReactions } from '@/hooks/useCommentReactions';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SPRING_SNAPPY } from '@/lib/motionTokens';
import { MentionSuggestion } from '@/components/post/post-wizard/steps/MentionBottomSheet';

import { CommentsHeader } from '@/components/comments/CommentsHeader';
import { CommentsList } from '@/components/comments/CommentsList';
import { CommentInput } from '@/components/comments/CommentInput';
import { CommentActionSheet } from '@/components/comments/CommentActionSheet';
import { ReportCommentModal } from '@/components/comments/ReportCommentModal';
import { BlockUserModal } from '@/components/comments/BlockUserModal';
import { GolfReactionPicker, GolfReactionType } from '@/components/comments/GolfReactionPicker';
import { TypingPresence } from '@/components/comments/TypingPresence';
import { LivePresenceBar } from '@/components/comments/LivePresenceBar';
import { RichCommentToolbar } from '@/components/comments/RichCommentToolbar';
import { triggerHaptic } from '@/components/comments/utils';

interface CommentsPageProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  videoThumbnail?: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorHomeClub?: string;
  creatorHandicap?: number | string;
  caption?: string;
  theme?: 'dark' | 'light' | 'grey';
  currentUserId?: string;
  creatorUserId?: string;
  initialCommentId?: string;
  initialParentCommentId?: string;
  courseId?: string;
  courseName?: string;
  courseCountry?: string;
  courseSubCountry?: string | null;
  courseRegion?: string | null;
  aspectRatio?: number;
  isReview?: boolean;
  reviewRating?: number;
  caddiePickCommentId?: string | null;
}

interface ReplyingToState {
  topLevelId: string;
  displayName: string;
}

export const CommentsPage: React.FC<CommentsPageProps> = ({
  isOpen,
  onClose,
  postId,
  theme = 'dark',
  currentUserId,
  creatorUserId,
  initialCommentId,
  initialParentCommentId,
  caddiePickCommentId,
}) => {
  // --- State ---
  const [newComment, setNewComment] = useState('');
  const newCommentRef = useRef('');
  newCommentRef.current = newComment;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingToState | null>(null);
  const [sortMode, setSortMode] = useState<'best' | 'newest'>('newest');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [selectedComment, setSelectedComment] = useState<CommentWithReplies | CommentReply | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pendingDeleteRef = useRef<CommentWithReplies | CommentReply | null>(null);
  const [editingComment, setEditingComment] = useState<CommentWithReplies | CommentReply | null>(null);
  const [listVisible, setListVisible] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [revealedCommentIds, setRevealedCommentIds] = useState<Set<string>>(new Set());
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [reactionPickerState, setReactionPickerState] = useState<{
    isOpen: boolean;
    commentId: string | null;
    position: { x: number; y: number };
  }>({ isOpen: false, commentId: null, position: { x: 0, y: 0 } });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasHandledInitialLinkRef = useRef(false);

  // --- Hooks ---
  const {
    comments,
    commentsLoading,
    addComment,
    isAddingComment,
    toggleCommentLike,
    isTogglingLike,
    deleteComment,
    isDeletingComment,
    updateComment,
    isUpdatingComment,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadAllReplies,
  } = useCommentsWithReplies(postId);

  const { hiddenCommentIds, hideComment } = useHiddenComments(postId);
  const { setCaddiePick, removeCaddiePick } = useCaddiePick(postId);
  useCommentsRealtime(postId);
  const { getReactionsForComment, toggleReaction } = useCommentReactions(postId, currentUserId);
  const { activeActor } = useActiveActor();

  const isDark = theme === 'dark';
  const isGrey = theme === 'grey';
  const isCurrentUserPostAuthor = currentUserId === creatorUserId;

  // --- Sorted comments ---
  const sortedComments = useMemo(() => {
    let sorted = [...comments];
    
    // Sort by mode
    if (sortMode === 'best') {
      sorted.sort((a, b) => {
        const getScore = (c: typeof a) => (c.likes_count || 0) + (c.replies_count || 0) + (getReactionsForComment(c.id).reactions?.length || 0);
        return getScore(b) - getScore(a);
      });
    }
    // 'newest' is the default order from the paginated query (ascending created_at)
    
    // Pin caddie pick to top regardless of sort
    if (caddiePickCommentId) {
      const idx = sorted.findIndex(c => c.id === caddiePickCommentId);
      if (idx > 0) {
        sorted = [sorted[idx], ...sorted.filter(c => c.id !== caddiePickCommentId)];
      }
    }
    return sorted;
  }, [comments, caddiePickCommentId, sortMode, getReactionsForComment]);

  // --- Callbacks ---
  const revealComment = useCallback((commentId: string) => {
    setRevealedCommentIds(prev => new Set(prev).add(commentId));
  }, []);

  const registerCommentRef = useCallback((commentId: string) => (el: HTMLDivElement | null) => {
    if (el) commentRefs.current.set(commentId, el);
    else commentRefs.current.delete(commentId);
  }, []);

  const highlightComment = useCallback((commentId: string, scrollToIt = true) => {
    setHighlightedCommentId(commentId);
    if (scrollToIt) {
      setTimeout(() => {
        commentRefs.current.get(commentId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
    setTimeout(() => setHighlightedCommentId(null), 1200);
  }, []);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      const kbHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(kbHeight);
    };
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
      setKeyboardOffset(0);
    };
  }, [isOpen]);

  // List entrance animation
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setListVisible(true), 100);
      return () => clearTimeout(t);
    } else {
      setListVisible(false);
    }
  }, [isOpen]);

  // Auto-focus input
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Deep linking
  useEffect(() => {
    if (!isOpen) { hasHandledInitialLinkRef.current = false; return; }
    if (!initialCommentId || commentsLoading || hasHandledInitialLinkRef.current) return;
    hasHandledInitialLinkRef.current = true;
    if (initialParentCommentId) {
      setExpandedReplies(prev => new Set(prev).add(initialParentCommentId));
    }
    const t = setTimeout(() => highlightComment(initialCommentId, true), 200);
    return () => clearTimeout(t);
  }, [isOpen, initialCommentId, initialParentCommentId, commentsLoading, highlightComment]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close emoji on close
  useEffect(() => { if (!isOpen) setShowEmojiPicker(false); }, [isOpen]);

  // Comment change with @mention detection
  const handleCommentChange = useCallback((value: string) => {
    setNewComment(value);
    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const currentText = newCommentRef.current;
    const rawUsername = mention.username || mention.name;
    const slugUsername = rawUsername.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const newValue = currentText.replace(/@\w*$/, `@${slugUsername} `);
    setNewComment(newValue);
    setShowMentions(false);
    setMentionQuery('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmitComment = useCallback(async () => {
    const content = newComment.trim();
    if (!content || isAddingComment || isUpdatingComment) return;

    if (editingComment) {
      const commentId = editingComment.id;
      setNewComment('');
      setEditingComment(null);
      setShowEmojiPicker(false);
      setShowMentions(false);
      triggerHaptic('success');
      try {
        await updateComment(commentId, content);
        toast.success('Comment updated');
      } catch {
        toast.error('Failed to update comment');
      }
      return;
    }

    const parentId = replyingTo?.topLevelId ?? undefined;
    setNewComment('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowMentions(false);
    triggerHaptic('success');

    try {
      const newCommentId = await addComment(content, parentId);
      if (parentId) setExpandedReplies(prev => new Set(prev).add(parentId));
      setTimeout(() => highlightComment(newCommentId, true), 150);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [newComment, isAddingComment, isUpdatingComment, editingComment, updateComment, addComment, replyingTo, highlightComment]);

  const handleReply = useCallback((commentId: string, userName: string) => {
    setReplyingTo({ topLevelId: commentId, displayName: userName });
    triggerHaptic('light');
    highlightComment(commentId, true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [highlightComment]);

  const toggleRepliesExpanded = useCallback((commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else { next.add(commentId); highlightComment(commentId, true); }
      return next;
    });
  }, [highlightComment]);

  const handleLongPress = useCallback((comment: CommentWithReplies | CommentReply) => {
    setSelectedComment(comment);
    setShowActionSheet(true);
  }, []);

  const handleOpenReactionPicker = useCallback((commentId: string, position: { x: number; y: number }) => {
    triggerHaptic('light');
    setReactionPickerState({ isOpen: true, commentId, position });
  }, []);

  const handleSelectReaction = useCallback((reactionType: GolfReactionType) => {
    if (reactionPickerState.commentId) {
      toggleReaction({ commentId: reactionPickerState.commentId, reactionType });
      triggerHaptic('success');
    }
  }, [reactionPickerState.commentId, toggleReaction]);

  const handleCopyText = useCallback(() => {
    if (selectedComment?.content) {
      navigator.clipboard.writeText(selectedComment.content);
      triggerHaptic('light');
    }
  }, [selectedComment]);

  const handleReport = useCallback((reason: string, details?: string) => {
    if (!selectedComment?.id) return;
    hideComment(selectedComment.id, reason, details);
  }, [selectedComment, hideComment]);

  const handleBlock = useCallback(() => {
    toast.info('Block coming soon');
    setShowBlockModal(false);
    setShowActionSheet(false);
  }, []);

  const handleDelete = useCallback(() => {
    pendingDeleteRef.current = selectedComment;
    setShowActionSheet(false);
    setTimeout(() => setShowDeleteConfirm(true), 200);
  }, [selectedComment]);

  const handleStartEdit = useCallback(() => {
    if (!selectedComment) return;
    setEditingComment(selectedComment);
    setNewComment(selectedComment.content);
    setReplyingTo(null);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [selectedComment]);

  // --- Render ---
  const content = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            style={{
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-[101] w-full rounded-t-3xl',
              'flex flex-col',
              !isDark && (isGrey ? 'bg-muted' : 'bg-[#f8fafc]')
            )}
            style={{
              height: '75dvh',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15)',
              ...(isDark ? { background: '#0d0d0d' } : {}),
            }}
          >
            {/* Dark mode overlays */}
            {isDark && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.35) 100%)' }}
                />
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.025]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                />
              </>
            )}

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <CommentsHeader
              isDark={isDark}
              commentCount={comments.length}
              onClose={onClose}
              sortMode={sortMode}
              onSortChange={setSortMode}
            />

            {/* Live presence bar */}
            <LivePresenceBar
              postId={postId}
              currentUserId={currentUserId}
              currentUserName={activeActor?.name}
              currentUserAvatar={activeActor?.avatarUrl}
              isDark={isDark}
            />

            {/* Comments list */}
            <CommentsList
              comments={sortedComments}
              commentsLoading={commentsLoading}
              isDark={isDark}
              isGrey={isGrey}
              currentUserId={currentUserId}
              creatorUserId={creatorUserId}
              caddiePickCommentId={caddiePickCommentId}
              highlightedCommentId={highlightedCommentId}
              hiddenCommentIds={hiddenCommentIds}
              revealedCommentIds={revealedCommentIds}
              expandedReplies={expandedReplies}
              listVisible={listVisible}
              keyboardOffset={keyboardOffset}
              onToggleLike={toggleCommentLike}
              isTogglingLike={isTogglingLike}
              onReply={handleReply}
              onLongPress={handleLongPress}
              onRevealComment={revealComment}
              onToggleReplies={toggleRepliesExpanded}
              onQuickReact={async (emoji) => {
                try { await addComment(emoji); } catch {}
              }}
              onOpenReactionPicker={handleOpenReactionPicker}
              getReactionsForComment={getReactionsForComment}
              onToggleReaction={toggleReaction}
              registerCommentRef={registerCommentRef}
              onClose={onClose}
              commentsListRef={commentsListRef as React.RefObject<HTMLDivElement>}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onFetchNextPage={() => fetchNextPage()}
              onLoadAllReplies={loadAllReplies}
            />

            {/* Typing presence */}
            <TypingPresence
              postId={postId}
              currentUserId={currentUserId}
              currentUserName={activeActor?.name}
              isDark={isDark}
              isTyping={newComment.length > 0}
            />

            {/* Rich comment toolbar */}
            <RichCommentToolbar
              isDark={isDark}
              isVisible={keyboardOffset > 0 || newComment.length > 0}
              onInsertText={(text) => {
                setNewComment(prev => prev + text);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
            />

            {/* Input */}
            <CommentInput
              isDark={isDark}
              isGrey={isGrey}
              newComment={newComment}
              onCommentChange={handleCommentChange}
              onSubmit={handleSubmitComment}
              isAddingComment={isAddingComment}
              isUpdatingComment={isUpdatingComment}
              editingComment={editingComment}
              onCancelEdit={() => { setEditingComment(null); setNewComment(''); }}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              keyboardOffset={keyboardOffset}
              activeActor={activeActor}
              showEmojiPicker={showEmojiPicker}
              onToggleEmojiPicker={() => setShowEmojiPicker(prev => !prev)}
              showMentions={showMentions}
              onMentionsOpenChange={setShowMentions}
              mentionQuery={mentionQuery}
              onMentionSelect={handleMentionSelect}
              inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
            />
          </motion.div>

          {/* Modals */}
          <AnimatePresence>
            {showActionSheet && (
              <CommentActionSheet
                isOpen={showActionSheet}
                onClose={() => { setShowActionSheet(false); setSelectedComment(null); }}
                isDark={isDark}
                isOwnComment={currentUserId === selectedComment?.user_id}
                onDelete={handleDelete}
                onEdit={handleStartEdit}
                onCopy={handleCopyText}
                onReport={() => { setShowActionSheet(false); setShowReportModal(true); }}
                onBlock={() => { setShowActionSheet(false); setShowBlockModal(true); }}
                isPostAuthor={isCurrentUserPostAuthor}
                isCaddiePick={selectedComment?.id === caddiePickCommentId}
                onSetCaddiePick={() => selectedComment && setCaddiePick(selectedComment.id)}
                onRemoveCaddiePick={() => removeCaddiePick()}
              />
            )}
          </AnimatePresence>

          {/* Delete confirm */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent className="z-[220]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your comment
                  {pendingDeleteRef.current && 'replies' in pendingDeleteRef.current && (pendingDeleteRef.current as CommentWithReplies).replies.length > 0
                    ? ` and all ${(pendingDeleteRef.current as CommentWithReplies).replies.length} ${(pendingDeleteRef.current as CommentWithReplies).replies.length === 1 ? 'reply' : 'replies'} to it`
                    : ''
                  }. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    const c = pendingDeleteRef.current;
                    if (c) {
                      try { await deleteComment(c.id); toast.success('Comment deleted'); }
                      catch { toast.error('Failed to delete comment'); }
                      setShowDeleteConfirm(false);
                      pendingDeleteRef.current = null;
                    }
                  }}
                >
                  {isDeletingComment ? 'Deleting…' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Report modal */}
          <AnimatePresence>
            {showReportModal && (
              <ReportCommentModal
                isOpen={showReportModal}
                onClose={() => { setShowReportModal(false); setSelectedComment(null); }}
                onSubmit={handleReport}
                isDark={isDark}
              />
            )}
          </AnimatePresence>

          {/* Block modal */}
          <AnimatePresence>
            {showBlockModal && selectedComment && (
              <BlockUserModal
                isOpen={showBlockModal}
                onClose={() => { setShowBlockModal(false); setSelectedComment(null); }}
                onConfirm={handleBlock}
                userName={selectedComment.user_name}
                isDark={isDark}
              />
            )}

            {/* Reaction picker */}
            <GolfReactionPicker
              isOpen={reactionPickerState.isOpen}
              onClose={() => setReactionPickerState(prev => ({ ...prev, isOpen: false }))}
              onSelect={handleSelectReaction}
              selectedReactions={
                reactionPickerState.commentId
                  ? getReactionsForComment(reactionPickerState.commentId).userReactions
                  : []
              }
              position={reactionPickerState.position}
              isDark={isDark}
            />
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default CommentsPage;
