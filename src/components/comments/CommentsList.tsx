import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommentItem } from '@/components/comments/CommentItem';
import { CommentsEmptyState } from '@/components/comments/CommentsEmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { CommentWithReplies, CommentReply } from '@/hooks/useCommentsWithReplies';
import type { GolfReactionType } from '@/components/comments/GolfReactionPicker';

interface CommentsListProps {
  comments: CommentWithReplies[];
  commentsLoading: boolean;
  isDark: boolean;
  isGrey: boolean;
  currentUserId?: string;
  creatorUserId?: string;
  caddiePickCommentId?: string | null;
  highlightedCommentId: string | null;
  hiddenCommentIds: Set<string>;
  revealedCommentIds: Set<string>;
  expandedReplies: Set<string>;
  listVisible: boolean;
  keyboardOffset: number;
  // Pagination
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  onLoadAllReplies: (commentId: string) => void;
  // Callbacks
  onToggleLike: (commentId: string) => void;
  isTogglingLike: boolean;
  onReply: (commentId: string, userName: string) => void;
  onLongPress: (comment: CommentWithReplies | CommentReply) => void;
  onRevealComment: (commentId: string) => void;
  onToggleReplies: (commentId: string) => void;
  onQuickReact: (emoji: string) => void;
  onOpenReactionPicker: (commentId: string, position: { x: number; y: number }) => void;
  getReactionsForComment: (commentId: string) => { reactions: { type: GolfReactionType; count: number }[]; userReactions: GolfReactionType[] };
  onToggleReaction: (params: { commentId: string; reactionType: GolfReactionType }) => void;
  registerCommentRef: (commentId: string) => (el: HTMLDivElement | null) => void;
  onClose: () => void;
  commentsListRef: React.RefObject<HTMLDivElement>;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  commentsLoading,
  isDark,
  isGrey,
  currentUserId,
  creatorUserId,
  caddiePickCommentId,
  highlightedCommentId,
  hiddenCommentIds,
  revealedCommentIds,
  expandedReplies,
  listVisible,
  keyboardOffset,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  onLoadAllReplies,
  onToggleLike,
  isTogglingLike,
  onReply,
  onLongPress,
  onRevealComment,
  onToggleReplies,
  onQuickReact,
  onOpenReactionPicker,
  getReactionsForComment,
  onToggleReaction,
  registerCommentRef,
  onClose,
  commentsListRef,
}) => {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = commentsListRef.current;
    if (!sentinel || !container || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onFetchNextPage();
      },
      { root: container, rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage, commentsListRef]);

  const handleMentionTap = useCallback(async (username: string) => {
    const cleaned = username.toLowerCase();
    const withSpaces = cleaned.replace(/_/g, ' ');
    const { data } = await supabase
      .from('taggable_entities')
      .select('entity_id, entity_type')
      .or(`username.eq.${cleaned},username.ilike.${withSpaces}`)
      .limit(1)
      .maybeSingle();
    if (data) {
      const route = data.entity_type === 'business'
        ? `/business/${data.entity_id}`
        : `/profile/${data.entity_id}`;
      navigate(route);
      setTimeout(() => onClose?.(), 50);
    }
  }, [navigate, onClose]);

  return (
    <motion.div
      ref={commentsListRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: listVisible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 overflow-y-auto pl-5 pr-4"
      style={{
        WebkitOverflowScrolling: 'touch',
        paddingBottom: Math.max(16, keyboardOffset + 72),
      }}
    >
      {commentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className={cn("text-sm", isDark ? "text-white/50" : "text-muted-foreground")}>
            Loading comments...
          </div>
        </div>
      ) : comments.length === 0 ? (
        <CommentsEmptyState isDark={isDark} onQuickReact={onQuickReact} />
      ) : (
        <div>
          {comments.map((comment) => {
            const repliesExpanded = expandedReplies.has(comment.id);
            const initialReplies = comment.replies.slice(0, 2);
            const visibleReplies = repliesExpanded ? comment.replies : initialReplies;
            const totalReplies = comment.total_replies_count ?? comment.replies_count;
            const hiddenRepliesCount = totalReplies - initialReplies.length;
            const isOwnComment = currentUserId === comment.user_id;
            const isThisCaddiePick = caddiePickCommentId === comment.id;

            return (
              <div key={comment.id} className="mb-2">
                <CommentItem
                  comment={comment}
                  isDark={isDark}
                  isGrey={isGrey}
                  onLike={onToggleLike}
                  onReply={onReply}
                  isLiking={isTogglingLike}
                  isOwnComment={isOwnComment}
                  onLongPress={onLongPress}
                  isAuthor={creatorUserId === comment.user_id}
                  isHighlighted={highlightedCommentId === comment.id}
                  isHidden={hiddenCommentIds.has(comment.id)}
                  isRevealed={revealedCommentIds.has(comment.id)}
                  onReveal={() => onRevealComment(comment.id)}
                  commentRef={registerCommentRef(comment.id)}
                  isCaddiePick={isThisCaddiePick}
                  onLongPressReaction={onOpenReactionPicker}
                  reactionCounts={getReactionsForComment(comment.id).reactions}
                  userReactions={getReactionsForComment(comment.id).userReactions}
                  onReactionToggle={(commentId, type) => onToggleReaction({ commentId, reactionType: type })}
                  onMentionTap={handleMentionTap}
                />

                {/* Replies */}
                {(comment.replies.length > 0 || totalReplies > 0) && (
                  <div className="relative ml-4">
                    <div
                      className="absolute w-[2px] rounded-full"
                      style={{
                        left: '18px',
                        top: '0px',
                        bottom: visibleReplies.length > 0 ? '24px' : '16px',
                        background: isDark
                          ? 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.04))'
                          : 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.03))',
                      }}
                    />
                    <div className="pt-1 pb-2">
                      {visibleReplies.map((reply, replyIndex) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          isDark={isDark}
                          isGrey={isGrey}
                          onLike={onToggleLike}
                          isReply
                          isLiking={isTogglingLike}
                          showDivider={replyIndex > 0}
                          isOwnComment={currentUserId === reply.user_id}
                          onLongPress={onLongPress}
                          isAuthor={creatorUserId === reply.user_id}
                          isHighlighted={highlightedCommentId === reply.id}
                          isHidden={hiddenCommentIds.has(reply.id)}
                          isRevealed={revealedCommentIds.has(reply.id)}
                          onReveal={() => onRevealComment(reply.id)}
                          commentRef={registerCommentRef(reply.id)}
                          onLongPressReaction={onOpenReactionPicker}
                          reactionCounts={getReactionsForComment(reply.id).reactions}
                          userReactions={getReactionsForComment(reply.id).userReactions}
                          onReactionToggle={(commentId, type) => onToggleReaction({ commentId, reactionType: type })}
                          onMentionTap={handleMentionTap}
                        />
                      ))}

                      {hiddenRepliesCount > 0 && !repliesExpanded && (
                        <button
                          onClick={() => {
                            onLoadAllReplies(comment.id);
                            onToggleReplies(comment.id);
                          }}
                          className={cn(
                            "relative z-10 flex items-center gap-1.5 text-[12px] font-medium py-2.5 pl-[32px] active:scale-[0.97] transition-transform",
                            isDark ? "text-white/50 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          View {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                      {repliesExpanded && totalReplies > 2 && (
                        <button
                          onClick={() => onToggleReplies(comment.id)}
                          className={cn(
                            "relative z-10 flex items-center gap-1.5 text-[12px] font-medium py-2.5 pl-[32px] active:scale-[0.97] transition-transform",
                            isDark ? "text-white/50 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Hide replies
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-px" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className={cn("w-5 h-5 animate-spin", isDark ? "text-white/40" : "text-muted-foreground")} />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CommentsList;
