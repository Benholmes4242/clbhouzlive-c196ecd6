/**
 * CommentsSheet — Full-featured comments bottom sheet.
 * Rebuilt from scratch. Hooks (useCommentsWithReplies, useCommentsRealtime) are untouched.
 */

import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { removeGolfCourseFromContent, extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MoreHorizontal, Send, ChevronRight, MapPin, Smile, Image as ImageIcon } from 'lucide-react';

// ── Local design tokens ──
const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const INK_MUTED = 'rgba(15,23,42,0.35)';
const AMBER = '#F7931E';
const BORDER = 'rgba(15,23,42,0.07)';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useCommentsWithReplies, type CommentWithReplies, type CommentReply } from '@/hooks/useCommentsWithReplies';
import { useEditorialComments } from '@/hooks/useEditorialComments';
import { useCommentsRealtime } from '@/hooks/useCommentsRealtime';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/comments/MentionText';
import { relativeTime } from '@/utils/relativeTime';
import { usePostLikes } from '@/hooks/usePostLikes';
import { supabase } from '@/integrations/supabase/client';
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

// ── Types ──

type SheetTab = 'comments' | 'likes';

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postImageUrl?: string | null;
  videoThumbnail?: string | null;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorHomeClub?: string | null;
  creatorHandicap?: number | null;
  caption?: string | null;
  theme?: 'light' | 'dark' | 'grey';
  currentUserId?: string | null;
  creatorUserId?: string;
  initialCommentId?: string | null;
  initialParentCommentId?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  courseCountry?: string | null;
  courseSubCountry?: string | null;
  courseRegion?: string | null;
  aspectRatio?: number;
  isReview?: boolean;
  reviewRating?: number | null;
  
  likesCount?: number | null;
  likeSource?: 'post' | 'editorial';
  editorialCardId?: string;
  onCommentPosted?: () => void;
  onCommentDeleted?: () => void;
}

interface ReplyTarget {
  topLevelId: string;
  displayName: string;
}

// ── Component ──

function CommentsSheet({
  isOpen,
  onClose,
  postId,
  theme = 'dark',
  currentUserId: currentUserIdProp,
  creatorUserId,
  initialCommentId,
  initialParentCommentId,
  
  caption,
  courseName,
  isReview,
  likesCount,
  likeSource = 'post',
  editorialCardId,
  onCommentPosted,
  onCommentDeleted,
}: CommentsSheetProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const currentUserId = currentUserIdProp ?? user?.id ?? null;

  // ── Hook — use editorial comments hook when editorialCardId is provided ──
  const standardHook = useCommentsWithReplies(editorialCardId ? '' : postId, onCommentDeleted);
  const editorialHook = useEditorialComments(editorialCardId ?? '', onCommentDeleted);
  const activeHook = editorialCardId ? editorialHook : standardHook;

  const {
    comments,
    commentsLoading,
    addComment,
    isAddingComment,
    toggleCommentLike,
    deleteComment,
    isDeletingComment,
    updateComment,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadAllReplies,
  } = activeHook;

  useCommentsRealtime(editorialCardId ? '' : postId, isOpen);

  // ── State ──
  const [activeTab, setActiveTab] = useState<SheetTab>('comments');
  const [sort, setSort] = useState<'best' | 'newest'>('newest');
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [commentToDelete, setCommentToDelete] = useState<CommentWithReplies | CommentReply | null>(null);
  const [inputText, setInputText] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<{ id: string; username: string; display_name: string; avatar: string | null }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const commentElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const isDark = false;

  const cleanCaption = useMemo(() => removeGolfCourseFromContent(caption ?? null), [caption]);
  const extractedCourse = useMemo(() => extractGolfCourseFromContent(caption ?? null), [caption]);
  const displayCourseName = courseName || extractedCourse?.name || null;

  // ── Likes hook ──
  const { data: likers, isLoading: likersLoading } =
    usePostLikes(postId, isOpen && activeTab === 'likes', likeSource);

  // ── Sorted comments ──
  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    if (sort === 'best') {
      sorted.sort((a, b) => {
        const score = (c: CommentWithReplies) => (c.likes_count || 0) + (c.replies_count || 0);
        return score(b) - score(a);
      });
    }
    return sorted;
  }, [comments, sort]);

  const totalCount = comments.length;


  // ── Effects ──

  // Auto-focus input
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => textareaRef.current?.focus(), 350);
      return () => clearTimeout(t);
    } else {
      setInputText('');
      setReplyingTo(null);
      setExpandedReplies(new Set());
      setActiveTab('comments');
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Mention autocomplete search
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 1) {
      setMentionResults([]);
      return;
    }
    const search = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .ilike('username', `${mentionQuery}%`)
        .limit(5);
      setMentionResults((data ?? []).map((u: any) => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar: u.profile_photo_url,
      })));
    };
    search();
  }, [mentionQuery]);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) fetchNextPage(); },
      { root: container, rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Deep link to comment
  const hasHandledDeepLink = useRef(false);
  useEffect(() => {
    if (!isOpen) { hasHandledDeepLink.current = false; return; }
    if (!initialCommentId || commentsLoading || hasHandledDeepLink.current) return;
    hasHandledDeepLink.current = true;
    if (initialParentCommentId) {
      setExpandedReplies(prev => new Set(prev).add(initialParentCommentId));
    }
    setTimeout(() => highlightComment(initialCommentId), 200);
  }, [isOpen, initialCommentId, initialParentCommentId, commentsLoading]);

  // ── Callbacks ──

  const highlightComment = useCallback((id: string) => {
    setHighlightedId(id);
    setTimeout(() => {
      commentElsRef.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    setTimeout(() => setHighlightedId(null), 1200);
  }, []);

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    const content = inputText.trim();
    if (!content || isAddingComment) return;

    const parentId = replyingTo?.topLevelId;
    setInputText('');
    setReplyingTo(null);

    try {
      const newId = await addComment(content, parentId);
      analyticsEvents.track('comment_submitted', {
        post_id: postId,
        is_reply: !!parentId,
        content_length: content.length,
        has_mention: content.includes('@'),
      });
      if (parentId) setExpandedReplies(prev => new Set(prev).add(parentId));
      setTimeout(() => highlightComment(newId), 150);
      onCommentPosted?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [inputText, isAddingComment, replyingTo, addComment, highlightComment, onCommentPosted]);

  const handleQuickReaction = useCallback(async (emoji: string) => {
    if (isAddingComment) return;
    try {
      const newId = await addComment(emoji, undefined);
      analyticsEvents.track('comment_submitted', {
        post_id: postId,
        is_reply: false,
        content_length: emoji.length,
        has_mention: false,
        quick_reaction: true,
      });
      setTimeout(() => highlightComment(newId), 150);
      onCommentPosted?.();
    } catch (error) {
      console.error('Failed to add quick reaction:', error);
    }
  }, [isAddingComment, addComment, postId, highlightComment, onCommentPosted]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const confirmDelete = useCallback(async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment(commentToDelete.id);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
    setCommentToDelete(null);
  }, [commentToDelete, deleteComment]);

  const registerRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) commentElsRef.current.set(id, el);
    else commentElsRef.current.delete(id);
  }, []);

  // ── Render helpers ──

  const renderCommentRow = (
    comment: CommentWithReplies | CommentReply,
    isReply: boolean,
    parentId?: string,
  ) => {
    const isOwn = currentUserId === comment.user_id;
    const isOP = comment.user_id === creatorUserId;
    

    return (
      <div
        key={comment.id}
        ref={registerRef(comment.id)}
        className={cn(
          'flex gap-3 px-4 py-3 transition-colors duration-300 hover:bg-[rgba(15,23,42,0.02)]',
          isReply && 'pl-10 sm:pl-14',
          highlightedId === comment.id && 'bg-[rgba(247,147,30,0.05)]',
        )}
      >
        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate(`/profile/${comment.actor_id || comment.user_id}`)}
          className="shrink-0"
        >
          <SquircleAvatar
            size={isReply ? 28 : 36}
            src={comment.avatar_url}
            alt={comment.user_name}
            fallback={comment.user_name?.charAt(0) || '?'}
            hideRing
          />
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Name + time */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="truncate max-w-[160px]"
              style={{ fontSize: 13.5, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}
            >
              {comment.user_name}
            </span>
            {isOP && (
              <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.06em', background: 'rgba(247,147,30,0.10)', color: AMBER }}>
                OP
              </span>
            )}
            <span style={{ fontSize: 11, color: INK_SUBTLE }}>
              · {relativeTime(comment.created_at)}
            </span>
            {(comment as any).is_edited && (
              <span style={{ fontSize: 11, color: 'rgba(15,23,42,0.3)' }}>
                edited
              </span>
            )}
          </div>

          {/* Content */}
          <MentionText
            text={comment.content}
            className="mt-1 text-[14px] leading-[20px] block"
          />

          {/* Media */}
          {(comment as any).media_url && (comment as any).media_type === 'image' && (
            <div className="mt-2 rounded-xl overflow-hidden max-w-[200px]">
              <img
                src={`${(window as any).__SUPABASE_URL || ''}/storage/v1/object/public/comment-images/${(comment as any).media_url}`}
                alt=""
                className="w-full object-cover rounded-xl"
                loading="lazy"
              />
            </div>
          )}

          {/* Action row — Reply only on the left */}
          {!isReply && (
            <div className="flex items-center mt-0.5">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo({ topLevelId: comment.id, displayName: comment.user_name });
                  highlightComment(comment.id);
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'rgba(15,23,42,0.5)',
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                  padding: 0,
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Reply
              </button>
            </div>
          )}
        </div>

        {/* Right-side stacked like button */}
        <button
          type="button"
          onClick={() => toggleCommentLike(comment.id)}
          aria-label={comment.has_liked ? 'Unlike' : 'Like'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            background: 'none',
            border: 0,
            padding: '6px 4px 0 8px',
            cursor: 'pointer',
            flexShrink: 0,
            minHeight: 44,
          }}
        >
          <Heart
            size={18}
            strokeWidth={2}
            style={{
              fill: comment.has_liked ? AMBER : 'none',
              color: comment.has_liked ? AMBER : INK_MUTED,
              transition: 'color 150ms, fill 150ms',
            }}
          />
          {comment.likes_count > 0 && (
            <span
              className="tabular-nums"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: comment.has_liked ? AMBER : INK_SUBTLE,
                lineHeight: 1,
              }}
            >
              {comment.likes_count}
            </span>
          )}
        </button>

        {/* Own-post / creator menu on the far right */}
        {(isOwn || creatorUserId === currentUserId) && !isReply && (
          <button
            type="button"
            onClick={() => setCommentToDelete(comment)}
            style={{
              padding: '6px 4px',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: 'rgba(15,23,42,0.3)',
              flexShrink: 0,
              minHeight: 44,
            }}
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>
    );
  };

  const renderTopLevelComment = (comment: CommentWithReplies, idx: number) => {
    const repliesExpanded = expandedReplies.has(comment.id);
    const totalReplies = comment.total_replies_count ?? comment.replies_count;

    return (
      <div key={comment.id}>
        {renderCommentRow(comment, false)}

        {/* Replies section */}
        {totalReplies > 0 && (
          <div style={{ marginLeft: 16, borderLeft: '0.5px solid rgba(15,23,42,0.07)' }}>
            {!repliesExpanded ? (
              <button
                type="button"
                onClick={async () => {
                  toggleReplies(comment.id);
                  setLoadingReplies(prev => new Set(prev).add(comment.id));
                  await loadAllReplies(comment.id);
                  setLoadingReplies(prev => {
                    const next = new Set(prev);
                    next.delete(comment.id);
                    return next;
                  });
                }}
                style={{
                  marginLeft: 32,
                  padding: '6px 0 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(15,23,42,0.5)',
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 44,
                }}
              >
                <span style={{ width: 18, height: 1, background: AMBER, opacity: 0.7 }} />
                View {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
              </button>
            ) : (
              <>
                {/* Reply loading shimmer */}
                {loadingReplies.has(comment.id) && comment.replies.length === 0 && (
                  <div className="space-y-0">
                    {[0, 1].map(i => (
                      <div key={i} className="flex gap-3 pl-10 sm:pl-14 pr-4 py-3">
                        <div className="w-[28px] h-[28px] rounded-[34%] shrink-0 bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                        <div className="flex-1 space-y-2 py-0.5">
                          <div className="h-[18px] w-20 rounded bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                          <div className="h-[18px] w-[75%] rounded bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {comment.replies.map(reply => renderCommentRow(reply, true, comment.id))}
                {comment.total_replies_count > comment.replies.length && (
                  <button
                    type="button"
                    onClick={() => loadAllReplies(comment.id)}
                    className="text-[12px] font-semibold min-h-[44px] flex items-center pl-10 sm:pl-14"
                    style={{ color: '#F7931E' }}
                  >
                    Load {comment.total_replies_count - comment.replies.length} more replies
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleReplies(comment.id)}
                  className={cn(
                    'text-[12px] font-semibold min-h-[44px] flex items-center pl-10 sm:pl-14',
                    isDark ? 'text-white/40' : 'text-muted-foreground'
                  )}
                >
                  Hide replies
                </button>
              </>
            )}
          </div>
        )}

        {/* Inset divider */}
        {idx < sortedComments.length - 1 && (
          <div style={{ marginLeft: 56, height: '0.5px', background: 'rgba(15,23,42,0.07)' }} />
        )}
      </div>
    );
  };

  // ── Portal content ──

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[210] bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-[211] w-full rounded-t-[20px] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-[560px] flex flex-col bg-[#F8FAFC]"
            style={{ minHeight: 'min(52dvh, 380px)', maxHeight: '92dvh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
            </div>

            {/* Header */}
            <div
              className="flex items-end justify-between px-4 pt-3 pb-0 shrink-0"
              style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}
            >
              {/* Left: tabs with inline counts */}
              <div className="flex items-end gap-6">
                {(['comments', 'likes'] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const count = tab === 'comments' ? totalCount : (likesCount ?? likers?.length ?? 0);
                  const label = tab === 'comments' ? 'Comments' : 'Likes';
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        scrollRef.current?.scrollTo({ top: 0 });
                      }}
                      className="relative flex items-baseline gap-1.5 pt-[10px] pb-[14px] min-h-[44px] bg-transparent border-0 cursor-pointer"
                    >
                      <span
                        className="whitespace-nowrap transition-colors duration-200"
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                          color: isActive ? INK : INK_SUBTLE,
                          lineHeight: 1.2,
                        }}
                      >
                        {label}
                      </span>
                      {count > 0 && (
                        <span
                          className="transition-colors duration-200 tabular-nums"
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: isActive ? 'rgba(15,23,42,0.5)' : INK_SUBTLE,
                            lineHeight: 1.2,
                          }}
                        >
                          {count}
                        </span>
                      )}
                      {/* Amber underline — 24px fixed */}
                      <div
                        className="absolute bottom-0 left-0 transition-opacity duration-200"
                        style={{
                          width: 24,
                          height: 2,
                          background: AMBER,
                          borderRadius: 1,
                          opacity: isActive ? 1 : 0,
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right: sort toggle + close */}
              <div className="flex items-center gap-1 pb-[8px]">
                <AnimatePresence>
                  {activeTab === 'comments' && totalCount > 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: 8, background: 'rgba(15,23,42,0.05)', padding: '2px' }}
                    >
                      {(['best', 'newest'] as const).map(s => {
                        const active = sort === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSort(s)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              minHeight: 28,
                              background: active ? '#fff' : 'transparent',
                              color: active ? INK : INK_SOFT,
                              boxShadow: active ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                              border: 0,
                              cursor: 'pointer',
                              transition: 'background 150ms, color 150ms',
                            }}
                          >
                            {s === 'best' ? 'Best' : 'Newest'}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-0 cursor-pointer"
                  aria-label="Close"
                >
                  <X size={16} style={{ color: INK_SUBTLE }} />
                </button>
              </div>
            </div>

            {/* Post caption — quote block */}
            {activeTab === 'comments' && (cleanCaption || displayCourseName) && (
              <div
                className="px-4 py-3 shrink-0 flex gap-3"
                style={{ borderBottom: `0.5px solid ${BORDER}` }}
              >
                {/* Vertical amber quote bar */}
                <div style={{ width: 3, borderRadius: 2, background: 'rgba(247,147,30,0.5)', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  {cleanCaption && (
                    <div style={{ color: INK_SOFT }}>
                      <MentionText
                        text={cleanCaption}
                        className="text-[13px] leading-[18px] line-clamp-2"
                        mentionClassName="font-semibold [color:#E8980A]"
                      />
                    </div>
                  )}
                  {displayCourseName && (
                    <div
                      className={cn('flex items-center gap-1', cleanCaption ? 'mt-1' : '')}
                      style={{ fontSize: 11.5, color: INK_SUBTLE }}
                    >
                      <MapPin size={11} style={{ color: AMBER }} strokeWidth={2.25} />
                      <span className="truncate">{displayCourseName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scroll area */}
            <div
              ref={scrollRef}
              onPointerDownCapture={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {activeTab === 'likes' ? (
                /* ── LIKES TAB ── */
                <div>
                  {likersLoading ? (
                    <div className="px-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3">
                          <div className="w-[40px] h-[40px] rounded-[34%] shrink-0 bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                          <div className="flex-1 space-y-2">
                            <div className="h-[16px] w-28 rounded bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                            <div className="h-[14px] w-20 rounded bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !likers || likers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4 min-h-[220px]">
                      <span className="text-4xl">🤍</span>
                      <div className="flex flex-col items-center gap-1.5">
                         <p className="text-[16px] font-semibold text-foreground">
                          No likes yet
                        </p>
                       <p className="text-[13px] text-center leading-relaxed text-muted-foreground">
                          Be the first to like this post
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {likers.map((liker) => (
                        <button
                          key={liker.userId}
                          type="button"
                          onClick={() => { navigate(`/profile/${liker.userId}`); onClose(); }}
                          className="flex items-center gap-3 w-full px-4 py-3 min-h-[64px] text-left"
                        >
                          <SquircleAvatar
                            size={40}
                            src={liker.avatarUrl}
                            alt={liker.displayName}
                            fallback={liker.displayName.charAt(0)}
                            hideRing
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold truncate text-foreground">
                              {liker.displayName}
                            </p>
                            {liker.username && (
                              <p className="text-[12px] truncate text-muted-foreground">
                                @{liker.username}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ── COMMENTS TAB ── */
                <AnimatePresence mode="wait">
                {commentsLoading ? (
                  /* Loading skeletons with crossfade */
                  <motion.div
                    key="comments-skeleton"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="px-4"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i}>
                        <div className="flex gap-3 py-3">
                          <div className="w-[34px] h-[34px] rounded-[34%] shrink-0 bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                          <div className="flex-1 space-y-2 py-0.5">
                            <div className="h-[18px] w-24 rounded bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                            <div className="h-[18px] w-[85%] rounded bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                            <div className="h-[18px] w-[55%] rounded bg-[rgba(15,23,42,0.06)] clb-shimmer-light" />
                          </div>
                        </div>
                        {i < 4 && (
                          <div style={{ marginLeft: 56, height: '0.5px', background: 'rgba(15,23,42,0.07)' }} />
                        )}
                      </div>
                    ))}
                  </motion.div>
                ) : comments.length === 0 ? (
                  /* Empty state */
                  <motion.div
                    key="comments-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex flex-col items-center justify-center px-8 gap-4 min-h-[220px]"
                  >
                    {/* Staggered bounce emoji cluster */}
                    <div className="flex gap-3 text-4xl">
                      <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>⛳</span>
                      <span className="inline-block animate-bounce" style={{ animationDelay: '180ms' }}>🏌️</span>
                      <span className="inline-block animate-bounce" style={{ animationDelay: '360ms' }}>💬</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <p className="text-[16px] font-semibold text-foreground">
                        No comments yet
                      </p>
                      <p className="text-[13px] text-center leading-relaxed text-muted-foreground">
                        {isReview
                          ? 'Be the first to review this course'
                          : 'Be the first to drop your thoughts'}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* Comment list */
                  <motion.div
                    key="comments-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {sortedComments.map((comment, idx) => renderTopLevelComment(comment, idx))}
                    <div ref={sentinelRef} className="h-px" />
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 rounded-full animate-spin border-muted border-t-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                )}
                </AnimatePresence>
              )}
            </div>

            {/* Input bar — only on Comments tab */}
            {activeTab === 'comments' && (
              <div
                className="shrink-0 px-4 py-3"
                style={{
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
                  borderTop: '0.5px solid rgba(15,23,42,0.07)',
                  background: '#F8FAFC',
                }}
              >
                {/* Reply indicator */}
                <AnimatePresence>
                  {replyingTo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 28 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between mb-2 overflow-hidden"
                    >
                      <span className="text-[13px] text-muted-foreground">
                        Replying to <span className="font-medium">{replyingTo.displayName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input row */}
                <div className="flex items-end gap-2">
                  <SquircleAvatar
                    size={32}
                    src={activeActor?.avatarUrl}
                    alt={activeActor?.name || 'You'}
                    fallback={activeActor?.name?.charAt(0) || '?'}
                    hideRing
                  />
                  <div className="flex-1 min-w-0 relative">
                    {/* Mention autocomplete dropdown */}
                    {mentionResults.length > 0 && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
                        borderRadius: 10, background: '#ffffff',
                        border: '1px solid rgba(15,23,42,0.07)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        overflow: 'hidden', zIndex: 215,
                      }}>
                        {mentionResults.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setInputText(prev => prev.replace(/@\w*$/, `@${u.username} `));
                              setMentionQuery(null);
                              setMentionResults([]);
                              textareaRef.current?.focus();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[rgba(15,23,42,0.04)]"
                          >
                            <SquircleAvatar
                              size={28}
                              src={u.avatar}
                              alt={u.display_name || u.username}
                              fallback={u.display_name?.charAt(0)?.toUpperCase() || '?'}
                              hideRing
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate text-foreground">
                                {u.display_name}
                              </span>
                              <span className="text-xs truncate text-muted-foreground">
                                @{u.username}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{
                      display: 'flex', alignItems: 'flex-end', borderRadius: 22, padding: '8px 12px',
                      background: 'rgba(15,23,42,0.05)',
                      border: '0.5px solid rgba(15,23,42,0.07)',
                    }}>
                      <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInputText(val);
                          const atMatch = val.match(/@(\w*)$/);
                          if (atMatch) {
                            setMentionQuery(atMatch[1]);
                          } else {
                            setMentionQuery(null);
                            setMentionResults([]);
                          }
                        }}
                        onKeyDown={handleInputKeyDown}
                        placeholder={replyingTo ? `Reply to ${replyingTo.displayName}...` : 'Add a comment...'}
                        rows={1}
                        className="flex-1 min-w-0 bg-transparent text-sm outline-none resize-none leading-snug text-foreground placeholder:text-muted-foreground"
                        style={{ maxHeight: '120px' }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isAddingComment}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: inputText.trim() ? '#F7931E' : 'rgba(15,23,42,0.08)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: inputText.trim() ? '0 2px 12px rgba(247,147,30,0.28)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <SendHorizontal style={{ color: inputText.trim() ? '#ffffff' : 'rgba(15,23,42,0.25)', width: 18, height: 18 }} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Delete confirmation */}
          <AlertDialog open={!!commentToDelete} onOpenChange={(open) => { if (!open) setCommentToDelete(null); }}>
            <AlertDialogContent className="z-[220]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCommentToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={confirmDelete}
                  disabled={isDeletingComment}
                >
                  {isDeletingComment ? 'Deleting…' : 'Delete'}
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

export { CommentsSheet };
export default memo(CommentsSheet);
