import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MoreHorizontal, Flag, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/utils/relativeTime';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/comments/MentionText';
import { CaddiePickBadge } from '@/components/comments/CaddiePickBadge';
import { ReactionDisplay } from '@/components/comments/ReactionDisplay';
import { VoiceNotePlayer } from '@/components/comments/VoiceNotePlayer';
import { CommentImage } from '@/components/comments/CommentImage';
import { FloatingReaction } from '@/components/comments/FloatingReaction';
import { AnimatedCount } from '@/components/comments/AnimatedCount';
import { triggerHaptic } from '@/components/comments/utils';
import type { CommentWithReplies, CommentReply } from '@/hooks/useCommentsWithReplies';
import type { GolfReactionType } from '@/components/comments/GolfReactionPicker';

export interface CommentItemProps {
  comment: CommentWithReplies | CommentReply;
  isDark: boolean;
  isGrey: boolean;
  onLike: (commentId: string) => void;
  onReply?: (commentId: string, userName: string) => void;
  isReply?: boolean;
  isLiking?: boolean;
  showDivider?: boolean;
  isOwnComment?: boolean;
  onLongPress?: (comment: CommentWithReplies | CommentReply) => void;
  isAuthor?: boolean;
  isHighlighted?: boolean;
  isHidden?: boolean;
  isRevealed?: boolean;
  onReveal?: () => void;
  commentRef?: (el: HTMLDivElement | null) => void;
  isCaddiePick?: boolean;
  reactionCounts?: { type: GolfReactionType; count: number }[];
  userReactions?: GolfReactionType[];
  onReactionToggle?: (commentId: string, type: GolfReactionType) => void;
  onLongPressReaction?: (commentId: string, position: { x: number; y: number }) => void;
  onMentionTap?: (username: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isDark,
  isGrey,
  onLike,
  onReply,
  isReply = false,
  isLiking,
  showDivider = false,
  isOwnComment = false,
  onLongPress,
  isAuthor = false,
  isHighlighted = false,
  isHidden = false,
  isRevealed = false,
  onReveal,
  commentRef,
  isCaddiePick = false,
  reactionCounts,
  userReactions,
  onReactionToggle,
  onLongPressReaction,
  onMentionTap,
}) => {
  const [showLikeAnim, setShowLikeAnim] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [floatingReactionTrigger, setFloatingReactionTrigger] = useState(0);
  const [floatingEmoji, setFloatingEmoji] = useState('');

  const handleLike = () => {
    if (!comment.has_liked) {
      setShowLikeAnim(true);
      setShowRipple(true);
      setTimeout(() => setShowLikeAnim(false), 600);
      setTimeout(() => setShowRipple(false), 400);
    }
    triggerHaptic('light');
    onLike(comment.id);
  };

  const handleTouchStart = () => {
    setIsPressing(true);
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('light');
      onLongPress?.(comment);
      setIsPressing(false);
    }, 500);
  };

  const handleTouchEnd = () => {
    setIsPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // If comment is hidden and not revealed, show soft-hide UI
  if (isHidden && !isRevealed) {
    return (
      <>
        {showDivider && (
          <div className={cn("h-px ml-[58px] mr-[56px]", isDark ? "bg-white/8" : "bg-border/20")} />
        )}
        <div ref={commentRef} className={cn("flex items-center gap-3 py-3", isReply && "pl-[26px]")}>
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isDark ? "bg-white/8" : "bg-muted/60")}>
            <Flag className={cn("w-4 h-4", isDark ? "text-white/35" : "text-muted-foreground/60")} />
          </div>
          <div className="flex-1">
            <span className={cn("text-[13px]", isDark ? "text-white/45" : "text-muted-foreground/70")}>
              You reported this comment.
            </span>
          </div>
          <button onClick={onReveal} className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
            isDark ? "bg-white/8 text-white/60 hover:bg-white/12" : "bg-muted/60 text-muted-foreground hover:bg-muted/80"
          )}>
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <motion.div
        ref={commentRef}
        className={cn(
          "flex items-start select-none relative rounded-xl transition-all duration-150",
          isReply ? "pl-[26px] py-2 gap-2.5" : "py-3 mb-1 gap-3",
          isCaddiePick && !isReply && (isDark
            ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent ring-1 ring-amber-500/20 mx-0"
            : "bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent ring-1 ring-amber-500/20 mx-0"),
          !isCaddiePick && !isReply && (isDark ? "bg-white/[0.02] mx-0" : "bg-muted/20 mx-0"),
          isPressing && "opacity-75 scale-[0.99]",
          isHighlighted && (isDark ? "bg-white/[0.05] ring-1 ring-white/12" : "bg-primary/[0.04] ring-1 ring-primary/15")
        )}
        initial={isHighlighted ? { opacity: 0 } : false}
        animate={isHighlighted ? { opacity: 1 } : {}}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); onLongPress?.(comment); }}
        style={{ backgroundColor: isDark ? undefined : undefined }}
      >
        <SquircleAvatar
          size={isReply ? 28 : 34}
          src={comment.avatar_url}
          alt={comment.user_name}
          fallback={comment.user_name?.charAt(0) || '?'}
          hideRing
        />
        <div className="flex-1 min-w-0">
          {/* Name + Author Badge + Timestamp row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-[15px] font-semibold truncate",
              isReply ? "max-w-[100px]" : "max-w-[140px]",
              isDark ? "text-white" : "text-foreground"
            )}>
              {comment.user_name}
            </span>
            {isAuthor && (
              <span className={cn(
                "flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
                isDark ? "bg-primary/20 text-primary" : "bg-primary/15 text-primary"
              )}>
                OP
              </span>
            )}
            {isCaddiePick && !isReply && <CaddiePickBadge size="sm" />}
            <span className={cn("text-[11px] flex-shrink-0", isDark ? "text-white/35" : "text-muted-foreground/50")}>
              {relativeTime(comment.created_at)}
            </span>
            {(comment as any).is_edited && (
              <span className={cn("text-[11px] flex-shrink-0", isDark ? "text-white/25" : "text-muted-foreground/40")}>
                · (edited)
              </span>
            )}
          </div>

          {/* Image attachment — rendered above text */}
          {(comment as any).media_type === 'image' && (comment as any).media_url && (
            <CommentImage mediaUrl={(comment as any).media_url} isDark={isDark} />
          )}

          <MentionText
            text={comment.content}
            className={cn(
              "mt-1 text-[14px] leading-[20px] block",
              isDark ? "text-white/90" : "text-foreground/90"
            )}
            onMentionTap={onMentionTap}
          />

          {/* Voice note player */}
          {(comment as any).media_type === 'voice' && (comment as any).media_url && (
            <VoiceNotePlayer
              mediaUrl={(comment as any).media_url}
              durationSeconds={(comment as any).voice_duration_seconds || 0}
              commentId={comment.id}
              isDark={isDark}
            />
          )}

          {!isReply && onReply && (
            <button
              onClick={() => { triggerHaptic('light'); onReply(comment.id, comment.user_name); }}
              className={cn(
                "mt-1 py-2.5 px-1 text-[12px] font-medium transition-transform active:scale-[0.97]",
                isDark ? "text-white/40" : "text-muted-foreground/70"
              )}
            >
              Reply
            </button>
          )}
        </div>

        {/* Reactions, FloatingReaction, and Like button area */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pr-1 relative">
          {isOwnComment && (
            <button
              onClick={(e) => { e.stopPropagation(); onLongPress?.(comment); }}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                isDark ? "text-white/40 hover:text-white/60 hover:bg-white/10" : "text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/50"
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}

          {reactionCounts && reactionCounts.length > 0 && (
            <ReactionDisplay
              reactions={reactionCounts}
              userReactions={userReactions || []}
              onReactionClick={(type) => {
                onReactionToggle?.(comment.id, type);
                const emoji = { heart: '❤️', fire: '🔥', flag: '⛳', eagle: '🦅', birdie: '🐦', clap: '👏' }[type];
                if (emoji) {
                  setFloatingEmoji(emoji);
                  setFloatingReactionTrigger(prev => prev + 1);
                }
              }}
              isDark={isDark}
            />
          )}

          <FloatingReaction emoji={floatingEmoji} trigger={floatingReactionTrigger} />

          <motion.button
            whileTap={{ scale: 0.75 }}
            onClick={handleLike}
            onContextMenu={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              onLongPressReaction?.(comment.id, { x: rect.left + rect.width / 2, y: rect.top });
            }}
            onTouchStart={(e) => {
              const timer = setTimeout(() => {
                const touch = e.touches[0];
                triggerHaptic('light');
                onLongPressReaction?.(comment.id, { x: touch.clientX, y: touch.clientY - 50 });
              }, 500);
              (e.currentTarget as any).longPressTimer = timer;
            }}
            onTouchEnd={(e) => {
              const timer = (e.currentTarget as any).longPressTimer;
              if (timer) clearTimeout(timer);
            }}
            disabled={isLiking}
            className="relative w-11 h-11 flex items-center justify-center group"
          >
            <AnimatePresence>
              {showRipple && (
                <motion.div
                  initial={{ scale: 0.3, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-6 h-6 rounded-full bg-like/20" />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showLikeAnim && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 fill-like text-like" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              animate={comment.has_liked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Heart className={cn(
                "w-4 h-4 transition-colors",
                comment.has_liked
                  ? "fill-like text-like"
                  : isDark ? "text-white/40 group-hover:text-like/70" : "text-muted-foreground/50 group-hover:text-like/70"
              )} />
            </motion.div>
          </motion.button>
          {comment.likes_count > 0 && (
            <AnimatedCount
              count={comment.likes_count}
              className={cn(
                "text-xs -ml-2",
                comment.has_liked ? "text-like" : isDark ? "text-white/50" : "text-muted-foreground/70"
              )}
            />
          )}
        </div>
      </motion.div>
    </>
  );
};

export default CommentItem;
