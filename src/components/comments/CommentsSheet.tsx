/**
 * CommentsSheet — Full-featured comments bottom sheet.
 * Rebuilt from scratch. Hooks (useCommentsWithReplies, useCommentsRealtime) are untouched.
 */

import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { removeGolfCourseFromContent, extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MoreHorizontal, SendHorizontal, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCommentsWithReplies, type CommentWithReplies, type CommentReply } from '@/hooks/useCommentsWithReplies';
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
  caddiePickCommentId?: string | null;
  likesCount?: number | null;
  likeSource?: 'post' | 'editorial';
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
  caddiePickCommentId,
  caption,
  courseName,
  isReview,
  likesCount,
  likeSource = 'post',
  onCommentPosted,
  onCommentDeleted,
}: CommentsSheetProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const currentUserId = currentUserIdProp ?? user?.id ?? null;

  // ── Hook ──
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
  } = useCommentsWithReplies(postId, onCommentDeleted);

  useCommentsRealtime(postId, isOpen);

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

  const isDark = theme === 'dark';

  const cleanCaption = useMemo(() => removeGolfCourseFromContent(caption ?? null), [caption]);
  const extractedCourse = useMemo(() => extractGolfCourseFromContent(caption ?? null), [caption]);
  const displayCourseName = courseName || extractedCourse?.name || null;

  // ── Likes hook ──
  const { data: likers, isLoading: likersLoading } =
    usePostLikes(postId, isOpen && activeTab === 'likes');

  // ── Sorted comments ──
  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    if (sort === 'best') {
      sorted.sort((a, b) => {
        const score = (c: CommentWithReplies) => (c.likes_count || 0) + (c.replies_count || 0);
        return score(b) - score(a);
      });
    }
    // Pin caddie pick to top
    if (caddiePickCommentId) {
      const idx = sorted.findIndex(c => c.id === caddiePickCommentId);
      if (idx > 0) {
        const [picked] = sorted.splice(idx, 1);
        sorted.unshift(picked);
      }
    }
    return sorted;
  }, [comments, sort, caddiePickCommentId]);

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
      if (parentId) setExpandedReplies(prev => new Set(prev).add(parentId));
      setTimeout(() => highlightComment(newId), 150);
      onCommentPosted?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [inputText, isAddingComment, replyingTo, addComment, highlightComment, onCommentPosted]);

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
    const isCaddie = comment.id === caddiePickCommentId;

    return (
      <div
        key={comment.id}
        ref={registerRef(comment.id)}
        className={cn(
          'flex gap-3 px-4 py-3 transition-colors duration-300',
          isReply && 'pl-10 sm:pl-14',
          highlightedId === comment.id && (isDark ? 'bg-white/[0.05]' : 'bg-primary/[0.04]'),
        )}
      >
        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate(`/profile/${comment.actor_id || comment.user_id}`)}
          className="shrink-0"
        >
          <SquircleAvatar
            size={isReply ? 28 : 34}
            src={comment.avatar_url}
            alt={comment.user_name}
            fallback={comment.user_name?.charAt(0) || '?'}
            hideRing
          />
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              'text-[13px] font-semibold truncate max-w-[140px]',
              isDark ? 'text-white' : 'text-foreground'
            )}>
              {comment.user_name}
            </span>
            {isOP && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-primary/15 text-primary">
                OP
              </span>
            )}
            {isCaddie && !isReply && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                Caddie Pick
              </span>
            )}
            <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-muted-foreground/60')}>
              {relativeTime(comment.created_at)}
            </span>
            {(comment as any).is_edited && (
              <span className={cn('text-[11px]', isDark ? 'text-white/25' : 'text-muted-foreground/40')}>
                edited
              </span>
            )}
          </div>

          {/* Content */}
          <MentionText
            text={comment.content}
            className={cn(
              'mt-1 text-[14px] leading-[20px] block',
              isDark ? 'text-white/90' : 'text-foreground/90'
            )}
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

          {/* Action row */}
          <div className="flex items-center gap-4 mt-0.5">
            {!isReply && (
              <button
                type="button"
                onClick={() => {
                  setReplyingTo({ topLevelId: comment.id, displayName: comment.user_name });
                  highlightComment(comment.id);
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
                className={cn(
                  'text-[12px] font-semibold min-h-[44px] flex items-center',
                  isDark ? 'text-white/40' : 'text-muted-foreground'
                )}
              >
                Reply
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleCommentLike(comment.id)}
              className="flex items-center gap-1 min-h-[44px]"
            >
              <Heart className={cn(
                'w-4 h-4 transition-colors',
                comment.has_liked
                  ? 'fill-[#f59e0b] text-[#f59e0b]'
                  : isDark ? 'text-white/40' : 'text-muted-foreground/50'
              )} />
              {comment.likes_count > 0 && (
                <span className={cn(
                  'text-[12px]',
                  comment.has_liked ? 'text-[#f59e0b]' : isDark ? 'text-white/50' : 'text-muted-foreground/70'
                )}>
                  {comment.likes_count}
                </span>
              )}
            </button>
            {(isOwn || creatorUserId === currentUserId) && (
              <button
                type="button"
                onClick={() => setCommentToDelete(comment)}
                className={cn(
                  'ml-auto min-h-[44px] flex items-center',
                  isDark ? 'text-white/30' : 'text-muted-foreground/40'
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
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
          <div className={cn('ml-4 border-l', isDark ? 'border-white/[0.08]' : 'border-border/50')}>
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
                className={cn(
                  'text-[12px] font-semibold min-h-[44px] flex items-center gap-1 pl-10',
                  'text-primary'
                )}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                View {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
              </button>
            ) : (
              <>
                {/* Reply loading shimmer */}
                {loadingReplies.has(comment.id) && comment.replies.length === 0 && (
                  <div className="space-y-0">
                    {[0, 1].map(i => (
                      <div key={i} className="flex gap-3 pl-10 sm:pl-14 pr-4 py-3">
                        <div className={cn('w-[28px] h-[28px] rounded-[34%] shrink-0', isDark ? 'bg-white/8 clb-shimmer-dark' : 'bg-muted clb-shimmer-light')} />
                        <div className="flex-1 space-y-2 py-0.5">
                          <div className={cn('h-[18px] w-20 rounded', isDark ? 'bg-white/8 clb-shimmer-dark' : 'bg-muted clb-shimmer-light')} />
                          <div className={cn('h-[18px] w-[75%] rounded', isDark ? 'bg-white/6 clb-shimmer-dark' : 'bg-muted/80 clb-shimmer-light')} />
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
                    className="text-[12px] font-semibold text-primary min-h-[44px] flex items-center pl-10 sm:pl-14"
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
          <div className={cn('ml-[56px] sm:ml-[64px] h-px', isDark ? 'bg-white/8' : 'bg-border/30')} />
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
            className={cn(
              'fixed inset-x-0 bottom-0 z-[211] w-full rounded-t-[20px]',
              'md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-[560px]',
              'flex flex-col',
              isDark ? 'bg-[#0d0d0d]' : 'bg-background'
            )}
            style={{ minHeight: 'min(52dvh, 380px)', maxHeight: '92dvh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div
              className="flex items-end justify-between px-4 pt-3 pb-0 shrink-0"
              style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}` }}
            >
              {/* Left: tab group */}
              <div className="flex items-end gap-6">
                {(['comments', 'likes'] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const count = tab === 'comments' ? totalCount : (likesCount ?? 0);
                  const label = tab === 'comments' ? 'Comments' : 'Likes';
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        scrollRef.current?.scrollTo({ top: 0 });
                      }}
                      className="relative flex flex-col items-center pb-[10px] min-h-[44px] bg-transparent border-0 cursor-pointer"
                    >
                      {/* Amber eyebrow count */}
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.05em] leading-none mb-[3px] transition-colors duration-200"
                        style={{ color: isActive ? '#F59E0B' : isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.25)' }}
                      >
                        {count > 0 ? count : '\u00A0'}
                      </span>
                      {/* Label */}
                      <span
                        className="text-[15px] font-semibold leading-snug whitespace-nowrap transition-colors duration-200"
                        style={{
                          color: isActive
                            ? (isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.90)')
                            : (isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.35)')
                        }}
                      >
                        {label}
                      </span>
                      {/* Amber underline bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full transition-opacity duration-200"
                        style={{
                          background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
                          opacity: isActive ? 1 : 0,
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right: sort toggle + close */}
              <div className="flex items-center gap-1 pb-[6px]">
                <AnimatePresence>
                  {activeTab === 'comments' && totalCount > 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'flex items-center p-0.5 gap-0.5 rounded-lg',
                        isDark ? 'bg-white/[0.07]' : 'bg-black/[0.06]'
                      )}
                    >
                      {(['best', 'newest'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSort(s)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors min-h-[28px] capitalize',
                            sort === s
                              ? isDark ? 'bg-white/[0.12] text-white/90' : 'bg-black/[0.10] text-foreground'
                              : isDark ? 'text-white/35' : 'text-muted-foreground'
                          )}
                        >
                          {s === 'best' ? 'Best' : 'Newest'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-0 cursor-pointer"
                >
                  <X className="w-[15px] h-[15px]" style={{ color: isDark ? 'rgba(255,255,255,0.40)' : undefined }} />
                </button>
              </div>
            </div>

            {/* Post caption — shown above comments when present */}
            {activeTab === 'comments' && (cleanCaption || displayCourseName) && (
              <div className={cn(
                'px-4 py-3 shrink-0 border-b',
                isDark ? 'border-white/[0.06]' : 'border-border/50'
              )}>
                {cleanCaption && (
                  <MentionText
                    text={cleanCaption}
                    className={cn(
                      'text-[14px] leading-[20px] line-clamp-2',
                      isDark ? 'text-white/70' : 'text-foreground/70'
                    )}
                    mentionClassName="font-semibold [color:#E8980A]"
                  />
                )}
                {displayCourseName && (
                  <p className={cn(
                    'text-[13px] leading-[18px] font-semibold truncate',
                    cleanCaption ? 'mt-1' : '',
                    isDark ? 'text-white' : 'text-foreground'
                  )}>
                    📍 {displayCourseName}
                  </p>
                )}
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
                          <div className={cn('w-[40px] h-[40px] rounded-[34%] shrink-0', isDark ? 'bg-white/8 clb-shimmer-dark' : 'bg-muted clb-shimmer-light')} />
                          <div className="flex-1 space-y-2">
                            <div className={cn('h-[16px] w-28 rounded', isDark ? 'bg-white/8 clb-shimmer-dark' : 'bg-muted clb-shimmer-light')} />
                            <div className={cn('h-[14px] w-20 rounded', isDark ? 'bg-white/6 clb-shimmer-dark' : 'bg-muted/80 clb-shimmer-light')} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !likers || likers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4 min-h-[220px]">
                      <span className="text-4xl">🤍</span>
                      <div className="flex flex-col items-center gap-1.5">
                        <p className={cn('text-[16px] font-semibold', isDark ? 'text-white' : 'text-foreground')}>
                          No likes yet
                        </p>
                        <p className={cn('text-[13px] text-center leading-relaxed', isDark ? 'text-white/50' : 'text-muted-foreground')}>
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
                            <p className={cn('text-[14px] font-semibold truncate', isDark ? 'text-white' : 'text-foreground')}>
                              {liker.displayName}
                            </p>
                            {liker.username && (
                              <p className={cn('text-[12px] truncate', isDark ? 'text-white/50' : 'text-muted-foreground')}>
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
                          <div className={cn('w-[34px] h-[34px] rounded-[34%] shrink-0', isDark ? 'bg-white/8 clb-shimmer-dark' : 'bg-muted clb-shimmer-light')} />
                          <div className="flex-1 space-y-2 py-0.5">
                            <div className={cn('h-[18px] w-24 rounded', isDark ? 'bg-white/8 clb-shimmer-dark' : 'bg-muted clb-shimmer-light')} />
                            <div className={cn('h-[18px] w-[85%] rounded', isDark ? 'bg-white/6 clb-shimmer-dark' : 'bg-muted/80 clb-shimmer-light')} />
                            <div className={cn('h-[18px] w-[55%] rounded', isDark ? 'bg-white/5 clb-shimmer-dark' : 'bg-muted/60 clb-shimmer-light')} />
                          </div>
                        </div>
                        {i < 4 && (
                          <div className={cn('ml-[56px] sm:ml-[64px] h-px', isDark ? 'bg-white/5' : 'bg-border/20')} />
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
                      <p className={cn('text-[16px] font-semibold', isDark ? 'text-white' : 'text-foreground')}>
                        No comments yet
                      </p>
                      <p className={cn('text-[13px] text-center leading-relaxed', isDark ? 'text-white/50' : 'text-muted-foreground')}>
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
                        <div className={cn('w-5 h-5 border-2 rounded-full animate-spin', isDark ? 'border-white/20 border-t-white/60' : 'border-muted border-t-muted-foreground')} />
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
                  borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid hsl(var(--border) / 0.5)',
                  background: isDark ? '#0d0d0d' : undefined,
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
                      <span className={cn('text-[13px]', isDark ? 'text-white/60' : 'text-muted-foreground')}>
                        Replying to <span className="font-medium">{replyingTo.displayName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X className={cn('w-4 h-4', isDark ? 'text-white/50' : 'text-muted-foreground')} />
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
                      <div className={cn(
                        'absolute bottom-full left-0 right-0 mb-1 rounded-xl shadow-lg border overflow-hidden z-[215]',
                        isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-background border-border'
                      )}>
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
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                              isDark ? 'hover:bg-white/10' : 'hover:bg-muted/50'
                            )}
                          >
                            <SquircleAvatar
                              size={28}
                              src={u.avatar}
                              alt={u.display_name || u.username}
                              fallback={u.display_name?.charAt(0)?.toUpperCase() || '?'}
                              hideRing
                            />
                            <div className="flex flex-col min-w-0">
                              <span className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-foreground')}>
                                {u.display_name}
                              </span>
                              <span className={cn('text-xs truncate', isDark ? 'text-white/50' : 'text-muted-foreground')}>
                                @{u.username}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className={cn(
                      'flex items-end rounded-[22px] px-4 py-2',
                      isDark
                        ? 'bg-white/10 border border-white/15'
                        : 'bg-muted border border-border/50'
                    )}>
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
                        className={cn(
                          'flex-1 min-w-0 bg-transparent text-sm outline-none resize-none leading-snug',
                          isDark
                            ? 'text-white placeholder:text-white/40'
                            : 'text-foreground placeholder:text-muted-foreground'
                        )}
                        style={{ maxHeight: '120px' }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isAddingComment}
                    className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0',
                      inputText.trim()
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/10 text-white/30'
                    )}
                  >
                    <SendHorizontal className="w-[18px] h-[18px]" />
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
