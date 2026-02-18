/**
 * CommentsPage - Full-screen slide-in comments experience
 * Final polish pass with Apple-level refinement:
 * - Premium header with smart media scaling (fit, not fill)
 * - Blurred background for non-filling media
 * - Consistent 8/12/16 spacing rhythm
 * - 44px tap targets throughout
 * - Refined animations and transitions
 * - Subtle haptics and micro-interactions
 * - One-level reply threading with vertical connector
 * - Elegant empty state with pulse animation
 * - Moderation/reporting UX
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, type RefObject } from 'react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, ChevronLeft, ChevronRight, Heart, X, MessageCircle, MoreHorizontal, Copy, Flag, Ban, Trash2, Eye } from 'lucide-react';
import CourseLocationRow from '@/components/posts/CourseLocationRow';
import { cn } from '@/lib/utils';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { useCommentsWithReplies, CommentWithReplies, CommentReply } from '@/hooks/useCommentsWithReplies';
import { useHiddenComments } from '@/hooks/useHiddenComments';
import { useCaddiePick } from '@/hooks/useCaddiePick';
import { useCommentsRealtime } from '@/hooks/useCommentsRealtime';
import { useCommentReactions } from '@/hooks/useCommentReactions';
import { relativeTime } from '@/utils/relativeTime';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MOTION_MED, EASE_OUT, SPRING_SNAPPY } from '@/lib/motionTokens';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { MentionBottomSheet, MentionSuggestion } from '@/components/post/post-wizard/steps/MentionBottomSheet';
import { MentionText, resolveAndNavigate } from '@/components/comments/MentionText';
import { CommentingAsIndicator } from '@/components/comments/CommentingAsIndicator';
import { CaddiePickBadge } from '@/components/comments/CaddiePickBadge';
import { GolfReactionPicker, GolfReactionType } from '@/components/comments/GolfReactionPicker';
import { ReactionDisplay } from '@/components/comments/ReactionDisplay';
import { useActiveActor } from '@/context/ActiveActorContext';

// Quick reaction emojis for long-press
const QUICK_REACTIONS = ['🔥', '⛳', '👏', '😂', '❤️'] as const;

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
  creatorUserId?: string; // Post owner's user ID for Author badge
  // Notification deep linking - when provided, will expand + scroll + highlight on mount
  initialCommentId?: string; // The comment to highlight
  initialParentCommentId?: string; // The parent comment to expand (for replies)
  // Golf course tag info (for "Played at" CTA)
  courseId?: string;
  courseName?: string;
  courseCountry?: string;
  courseSubCountry?: string | null;
  courseRegion?: string | null;
  // Media aspect ratio for smart thumbnail rendering
  aspectRatio?: number; // width/height - < 1 = portrait, >= 1 = landscape
  // Review post info
  isReview?: boolean;
  reviewRating?: number;
  // Caddie's Pick - the highlighted comment ID
  caddiePickCommentId?: string | null;
}

// ReplyingTo state always stores the top-level comment ID for one-level threading
interface ReplyingToState {
  topLevelId: string; // Always the parent comment ID, never a reply ID
  displayName: string; // Name to show in "Replying to X"
}

interface CommentItemProps {
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
  isAuthor?: boolean; // True if comment author is the post creator
  isHighlighted?: boolean; // True if comment should show glow effect
  isHidden?: boolean; // True if user reported this comment (soft-hide)
  isRevealed?: boolean; // True if user tapped "view" on a hidden comment (session state)
  onReveal?: () => void; // Callback to reveal a hidden comment
  commentRef?: (el: HTMLDivElement | null) => void; // Ref callback for scroll/highlight
  isCaddiePick?: boolean; // True if this is the Caddie's Pick comment
  // Golf reactions
  reactionCounts?: { type: GolfReactionType; count: number }[];
  userReactions?: GolfReactionType[];
  onReactionToggle?: (commentId: string, type: GolfReactionType) => void;
  onLongPressReaction?: (commentId: string, position: { x: number; y: number }) => void;
  onMentionTap?: (username: string) => void;
}

// Haptic feedback utility
const triggerHaptic = (type: 'light' | 'success' | 'warning' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      success: [10, 50, 10],
      warning: [20, 30, 20],
    };
    navigator.vibrate(patterns[type]);
  }
};

const CommentItem: React.FC<CommentItemProps> = ({
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

  const handleLike = () => {
    if (!comment.has_liked) {
      // Trigger both animations
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
          <div 
            className={cn(
              "h-px ml-[58px] mr-[56px]",
              isDark ? "bg-white/8" : "bg-border/20"
            )}
          />
        )}
        <div 
          ref={commentRef}
          className={cn(
            "flex items-center gap-3 py-3",
            isReply && "pl-[26px]"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isDark ? "bg-white/8" : "bg-muted/60"
          )}>
            <Flag className={cn("w-4 h-4", isDark ? "text-white/35" : "text-muted-foreground/60")} />
          </div>
          <div className="flex-1">
            <span className={cn(
              "text-[13px]",
              isDark ? "text-white/45" : "text-muted-foreground/70"
            )}>
              You reported this comment.
            </span>
          </div>
          <button
            onClick={onReveal}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
              isDark 
                ? "bg-white/8 text-white/60 hover:bg-white/12" 
                : "bg-muted/60 text-muted-foreground hover:bg-muted/80"
            )}
          >
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
          // Caddie's Pick special treatment - subtle gold accent
          isCaddiePick && !isReply && (isDark 
            ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent ring-1 ring-amber-500/20 mx-0" 
            : "bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent ring-1 ring-amber-500/20 mx-0"),
          // Subtle card treatment for parent comments only (no replies)
          !isCaddiePick && !isReply && (isDark 
            ? "bg-white/[0.02] mx-0" 
            : "bg-muted/20 mx-0"),
          isPressing && "opacity-75 scale-[0.99]",
          // Highlight glow effect - subtle and refined
          isHighlighted && (isDark 
            ? "bg-white/[0.05] ring-1 ring-white/12" 
            : "bg-primary/[0.04] ring-1 ring-primary/15")
        )}
        initial={isHighlighted ? { opacity: 0 } : false}
        animate={isHighlighted ? { opacity: 1 } : {}}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          onLongPress?.(comment);
        }}
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
            {/* OP badge - enhanced styling */}
            {isAuthor && (
              <span className={cn(
                "flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
                isDark 
                  ? "bg-primary/20 text-primary" 
                  : "bg-primary/15 text-primary"
              )}>
                OP
              </span>
            )}
            {/* Caddie's Pick badge */}
            {isCaddiePick && !isReply && (
              <CaddiePickBadge size="sm" />
            )}
            <span className={cn(
              "text-[11px] flex-shrink-0",
              isDark ? "text-white/35" : "text-muted-foreground/50"
            )}>
              {relativeTime(comment.created_at)}
            </span>
          </div>
          
          {/* Comment body - proper spacing from name row, with @mention highlighting */}
          <MentionText
            text={comment.content}
            className={cn(
              "mt-1 text-[14px] leading-[20px] block",
              isDark ? "text-white/90" : "text-foreground/90"
            )}
            onMentionTap={onMentionTap}
          />
          
          {/* Reply action - inline, consistent alignment */}
          {!isReply && onReply && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onReply(comment.id, comment.user_name);
              }}
              className={cn(
                "mt-1 py-2.5 px-1 text-[12px] font-medium transition-transform active:scale-[0.97]",
                isDark ? "text-white/40" : "text-muted-foreground/70"
              )}
            >
              Reply
            </button>
          )}
        </div>

        {/* Reactions and Like button area */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pr-1">
          {/* Show reaction emojis if any */}
          {reactionCounts && reactionCounts.length > 0 && (
            <ReactionDisplay
              reactions={reactionCounts}
              userReactions={userReactions || []}
              onReactionClick={(type) => onReactionToggle?.(comment.id, type)}
              isDark={isDark}
            />
          )}
          
          {/* Heart button - tap for quick like, long-press for reaction picker */}
          <motion.button
            whileTap={{ scale: 0.75 }}
            onClick={handleLike}
            onContextMenu={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              onLongPressReaction?.(comment.id, { 
                x: rect.left + rect.width / 2, 
                y: rect.top 
              });
            }}
            onTouchStart={(e) => {
              // Long press detection for mobile (reaction picker)
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
            {/* Ripple effect */}
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
            {/* Heart scale animation */}
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
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  comment.has_liked
                    ? "fill-like text-like"
                    : isDark 
                      ? "text-white/40 group-hover:text-like/70" 
                      : "text-muted-foreground/50 group-hover:text-like/70"
                )}
              />
            </motion.div>
          </motion.button>
          {comment.likes_count > 0 && (
            <span className={cn(
              "text-xs -ml-2",
              comment.has_liked 
                ? "text-like" 
                : isDark ? "text-white/50" : "text-muted-foreground/70"
            )}>
              {comment.likes_count}
            </span>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Report reasons
const REPORT_REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'nudity', label: 'Nudity' },
  { id: 'violence', label: 'Violence' },
  { id: 'misinformation', label: 'Misinformation' },
  { id: 'other', label: 'Other' },
];

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isOwnComment: boolean;
  onDelete?: () => void;
  onCopy?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
  // Caddie's Pick props
  isPostAuthor?: boolean; // Whether the current user is the post author
  isCaddiePick?: boolean; // Whether the selected comment is currently the Caddie's Pick
  onSetCaddiePick?: () => void;
  onRemoveCaddiePick?: () => void;
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  isDark,
  isOwnComment,
  onDelete,
  onCopy,
  onReport,
  onBlock,
  isPostAuthor = false,
  isCaddiePick = false,
  onSetCaddiePick,
  onRemoveCaddiePick,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div className={cn(
        "absolute inset-0",
        isDark ? "bg-black/60" : "bg-black/40"
      )} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-md mx-4 mb-4 rounded-[20px] overflow-hidden",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        {/* Caddie's Pick options - for post authors only */}
        {isPostAuthor && !isOwnComment && (
          <>
            {!isCaddiePick ? (
              <button
                onClick={() => { onSetCaddiePick?.(); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                  isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
                )}
              >
                <span className="w-5 h-5 flex items-center justify-center text-base">🏌️</span>
                <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Set as Caddie's Pick</span>
              </button>
            ) : (
              <button
                onClick={() => { onRemoveCaddiePick?.(); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                  isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
                )}
              >
                <X className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
                <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Remove Caddie's Pick</span>
              </button>
            )}
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
          </>
        )}

        {isOwnComment ? (
          <>
            <button
              onClick={() => { onCopy?.(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
              )}
            >
              <Copy className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
              <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Copy text</span>
            </button>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
            <button
              onClick={() => { onDelete?.(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                "text-red-500 hover:bg-red-500/10"
              )}
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[15px]">Delete</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { onCopy?.(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
              )}
            >
              <Copy className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
              <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Copy text</span>
            </button>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
            <button
              onClick={() => { onReport?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
              )}
            >
              <Flag className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
              <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Report</span>
            </button>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
            <button
              onClick={() => { onBlock?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors text-red-500 hover:bg-red-500/10"
              )}
            >
              <Ban className="w-5 h-5" />
              <span className="text-[15px]">Block user</span>
            </button>
          </>
        )}
        
        <div className={cn("h-2", isDark ? "bg-black/30" : "bg-muted/50")} />
        
        <button
          onClick={onClose}
          className={cn(
            "w-full py-4 text-[16px] font-medium transition-colors",
            isDark ? "text-white hover:bg-white/5" : "text-foreground hover:bg-muted/50"
          )}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => void;
  isDark: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, isDark }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'reason' | 'details' | 'confirm'>('reason');

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason, details);
      triggerHaptic('success');
      setStep('confirm');
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setStep('reason');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className={cn(
        "absolute inset-0",
        isDark ? "bg-black/70" : "bg-black/50"
      )} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-sm rounded-[20px] overflow-hidden",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        {step === 'confirm' ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={cn("text-[18px] font-semibold mb-2", isDark ? "text-white" : "text-foreground")}>
              Thanks for letting us know
            </h3>
            <p className={cn("text-[14px] mb-6", isDark ? "text-white/60" : "text-muted-foreground")}>
              We'll review this comment and take action if needed.
            </p>
            <button
              onClick={handleClose}
              className={cn(
                "w-full py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                isDark ? "bg-white text-black" : "bg-foreground text-background"
              )}
            >
              Done
            </button>
          </div>
        ) : step === 'details' ? (
          <div className="p-5">
            <h3 className={cn("text-[18px] font-semibold mb-4", isDark ? "text-white" : "text-foreground")}>
              Add details (optional)
            </h3>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us more about this issue..."
              className={cn(
                "w-full h-24 px-4 py-3 rounded-[12px] text-[14px] resize-none outline-none",
                isDark 
                  ? "bg-white/10 text-white placeholder:text-white/40 border border-white/15"
                  : "bg-muted text-foreground placeholder:text-muted-foreground border border-border"
              )}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep('reason')}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  isDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
                )}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  isDark ? "bg-white text-black" : "bg-foreground text-background"
                )}
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <h3 className={cn("text-[18px] font-semibold mb-4", isDark ? "text-white" : "text-foreground")}>
              Why are you reporting this?
            </h3>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-[12px] transition-colors",
                    selectedReason === reason.id
                      ? isDark ? "bg-white/15" : "bg-primary/10"
                      : isDark ? "bg-white/5 hover:bg-white/10" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className={cn("text-[14px]", isDark ? "text-white" : "text-foreground")}>
                    {reason.label}
                  </span>
                  {selectedReason === reason.id && (
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center",
                      isDark ? "bg-white" : "bg-primary"
                    )}>
                      <svg className={cn("w-3 h-3", isDark ? "text-black" : "text-white")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleClose}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  isDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
                )}
              >
                Cancel
              </button>
              <button
                onClick={() => selectedReason && setStep('details')}
                disabled={!selectedReason}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  isDark ? "bg-white text-black" : "bg-foreground text-background"
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

interface BlockConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isDark: boolean;
}

const BlockConfirmModal: React.FC<BlockConfirmModalProps> = ({ isOpen, onClose, onConfirm, userName, isDark }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className={cn(
        "absolute inset-0",
        isDark ? "bg-black/70" : "bg-black/50"
      )} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-sm rounded-[20px] overflow-hidden p-6",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        <h3 className={cn("text-[18px] font-semibold mb-2", isDark ? "text-white" : "text-foreground")}>
          Block {userName}?
        </h3>
        <p className={cn("text-[14px] mb-6", isDark ? "text-white/60" : "text-muted-foreground")}>
          They won't be able to see your posts or interact with you. You won't see their comments.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
              isDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              triggerHaptic('warning');
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 rounded-[12px] text-[15px] font-medium bg-red-500 text-white transition-colors hover:bg-red-600"
          >
            Block
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const CommentsPage: React.FC<CommentsPageProps> = ({
  isOpen,
  onClose,
  postId,
  videoThumbnail,
  creatorName,
  creatorAvatar,
  creatorHomeClub,
  creatorHandicap,
  caption,
  theme = 'dark',
  currentUserId,
  creatorUserId,
  initialCommentId,
  initialParentCommentId,
  courseId,
  courseName,
  courseCountry,
  courseSubCountry,
  courseRegion,
  aspectRatio,
  isReview,
  reviewRating,
  caddiePickCommentId,
}) => {
  const [newComment, setNewComment] = useState('');
  const newCommentRef = useRef('');
  newCommentRef.current = newComment;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingToState | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [selectedComment, setSelectedComment] = useState<CommentWithReplies | CommentReply | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [revealedCommentIds, setRevealedCommentIds] = useState<Set<string>>(new Set());
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  // Golf reaction picker state
  const [reactionPickerState, setReactionPickerState] = useState<{
    isOpen: boolean;
    commentId: string | null;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    commentId: null,
    position: { x: 0, y: 0 },
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasHandledInitialLinkRef = useRef(false);

  const {
    comments,
    commentsLoading,
    addComment,
    isAddingComment,
    toggleCommentLike,
    isTogglingLike,
  } = useCommentsWithReplies(postId);

  // Hidden comments management (soft-hide for reporter)
  const { hiddenCommentIds, hideComment } = useHiddenComments(postId);

  // Caddie's Pick management
  const { setCaddiePick, removeCaddiePick, isSettingCaddiePick } = useCaddiePick(postId);

  // Real-time updates for comments, likes, and reactions
  useCommentsRealtime(postId);

  // Golf reactions
  const { getReactionsForComment, toggleReaction } = useCommentReactions(postId, currentUserId);

  // Get current user's active actor for avatar in input
  const { activeActor } = useActiveActor();

  const navigate = useNavigate();

  // Check if current user is the post author
  const isCurrentUserPostAuthor = currentUserId === creatorUserId;

  // Sort comments with Caddie's Pick at top
  const sortedComments = useMemo(() => {
    if (!caddiePickCommentId || !comments.length) return comments;
    
    const caddiePickIndex = comments.findIndex(c => c.id === caddiePickCommentId);
    if (caddiePickIndex === -1) return comments;
    
    const caddiePick = comments[caddiePickIndex];
    const rest = comments.filter(c => c.id !== caddiePickCommentId);
    
    return [caddiePick, ...rest];
  }, [comments, caddiePickCommentId]);


  const isDark = theme === 'dark';
  const isGrey = theme === 'grey';

  // Reveal a hidden comment (session-only, persists while on this screen)
  const revealComment = useCallback((commentId: string) => {
    setRevealedCommentIds(prev => new Set(prev).add(commentId));
  }, []);
  
  // Register a ref for a comment (works for both parent and reply)
  const registerCommentRef = useCallback((commentId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      commentRefs.current.set(commentId, el);
    } else {
      commentRefs.current.delete(commentId);
    }
  }, []);

  // Highlight a comment with glow effect and auto-clear
  const highlightComment = useCallback((commentId: string, scrollToIt = true) => {
    setHighlightedCommentId(commentId);
    
    if (scrollToIt) {
      // Use a small delay to ensure refs are registered after render
      setTimeout(() => {
        const el = commentRefs.current.get(commentId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
    
    // Clear highlight after 1200ms (120ms fade in + 800ms hold + 300ms fade out)
    setTimeout(() => {
      setHighlightedCommentId(null);
    }, 1200);
  }, []);

  // iOS keyboard-aware animations using VisualViewport API
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    
    const viewport = window.visualViewport;
    if (!viewport) return;
    
    const handleResize = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(offset);
    };
    
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
      setKeyboardOffset(0);
    };
  }, [isOpen]);

  // Page entrance animation - fade in list after mount
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setListVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setListVisible(false);
    }
  }, [isOpen]);

  // Focus management: auto-focus input after slide-in animation completes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350); // After 300ms slide-in animation completes
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Notification deep linking - expand parent, scroll to comment, highlight it (runs once per open)
  useEffect(() => {
    // Reset guard when modal closes
    if (!isOpen) {
      hasHandledInitialLinkRef.current = false;
      return;
    }
    
    // Skip if no initial comment, still loading, or already handled
    if (!initialCommentId || commentsLoading || hasHandledInitialLinkRef.current) return;
    
    // Mark as handled to prevent double-scroll/glow
    hasHandledInitialLinkRef.current = true;
    
    // If this is a reply, expand the parent thread first
    if (initialParentCommentId) {
      setExpandedReplies(prev => new Set(prev).add(initialParentCommentId));
    }
    
    // Wait for render to complete, then highlight and scroll
    const timer = setTimeout(() => {
      highlightComment(initialCommentId, true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [isOpen, initialCommentId, initialParentCommentId, commentsLoading, highlightComment]);

  // Handle comment input change with @mention detection
  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Detect @mention trigger - look for @ followed by word characters at the end
    const mentionMatch = value.match(/@(\w*)$/);
    
    if (mentionMatch) {
      console.log('[MENTION] @ detected, opening sheet. Query:', mentionMatch[1]);
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      console.log('[MENTION] No @ match, closing sheet');
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  // Handle mention selection from bottom sheet
  // Uses a ref to avoid stale closure on newComment — ref always holds latest value
  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    console.log('[MENTION] handleMentionSelect CALLED with:', {
      name: mention.name,
      username: mention.username,
      entity_id: mention.entity_id,
      currentInputValue: newCommentRef.current,
    });

    const currentText = newCommentRef.current;
    const displayName = mention.username || mention.name;
    const newValue = currentText.replace(/@\w*$/, `@${displayName} `);

    console.log('[MENTION] Replacement result:', {
      currentText,
      displayName,
      regexMatch: currentText.match(/@\w*$/),
      newValue,
    });

    setNewComment(newValue);
    setShowMentions(false);
    setMentionQuery('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []); // no dependency on newComment — reads from ref

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || isAddingComment) return;
    
    // For replies, always attach to top-level parent (one-level threading)
    // topLevelId is guaranteed to be a parent comment ID, never a reply ID
    const parentId = replyingTo?.topLevelId ?? undefined;
    
    // Store current content before clearing
    const content = newComment;
    setNewComment('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowMentions(false);
    triggerHaptic('success');
    
    try {
      // Add comment and get the exact new comment ID
      const newCommentId = await addComment(content, parentId);
      
      // If this is a reply, expand the parent thread first
      if (parentId) {
        setExpandedReplies(prev => new Set(prev).add(parentId));
      }
      
      // Wait for query invalidation to complete, then highlight
      setTimeout(() => {
        highlightComment(newCommentId, true);
      }, 150);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [newComment, isAddingComment, addComment, replyingTo, highlightComment]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  }, [handleSubmitComment]);

  const handleReply = useCallback((commentId: string, userName: string) => {
    // commentId is always a top-level comment ID (Reply button only appears on parent comments)
    // This ensures one-level threading - replies always attach to the parent comment
    setReplyingTo({ topLevelId: commentId, displayName: userName });
    triggerHaptic('light');
    
    // Highlight the comment being replied to
    highlightComment(commentId, true);
    
    // Ensure cursor appears inside input field
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [highlightComment]);

  const handleEmojiSelect = useCallback((emoji: any) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = newComment.slice(0, start) + emoji.native + newComment.slice(end);
      setNewComment(newValue);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
      });
    } else {
      setNewComment(prev => prev + emoji.native);
    }
  }, [newComment]);

  const toggleRepliesExpanded = useCallback((commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        // Highlight parent comment when expanding replies
        highlightComment(commentId, true);
      }
      return next;
    });
  }, [highlightComment]);

  const handleLongPress = useCallback((comment: CommentWithReplies | CommentReply) => {
    setSelectedComment(comment);
    setShowActionSheet(true);
  }, []);

  // Handler for opening reaction picker
  const handleOpenReactionPicker = useCallback((commentId: string, position: { x: number; y: number }) => {
    triggerHaptic('light');
    setReactionPickerState({
      isOpen: true,
      commentId,
      position,
    });
  }, []);

  // Handler for selecting a reaction
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
    
    // Soft-hide the comment for this user
    hideComment(selectedComment.id, reason, details);
    
    console.log('Report submitted:', { commentId: selectedComment.id, reason, details });
  }, [selectedComment, hideComment]);

  const handleBlock = useCallback(() => {
    toast.info('Block coming soon');
    setShowBlockModal(false);
    setShowActionSheet(false);
  }, []);

  const handleDelete = useCallback(() => {
    toast.info('Delete coming soon');
    setShowActionSheet(false);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close emoji picker on navigation
  useEffect(() => {
    if (!isOpen) {
      setShowEmojiPicker(false);
    }
  }, [isOpen]);

  // Caption truncation logic - strip golf course tag from caption since we render it separately
  const cleanCaption = removeGolfCourseFromContent(caption || '');
  const captionNeedsTruncation = cleanCaption && cleanCaption.length > 120;
  const displayCaption = expandedCaption ? cleanCaption : cleanCaption?.slice(0, 120);

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
            className={cn(
              "fixed inset-0 z-[100] backdrop-blur-sm",
              isDark ? "bg-black/70" : "bg-black/40"
            )}
            onClick={onClose}
          />

          {/* Comments Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={SPRING_SNAPPY}
            className={cn(
              'fixed inset-y-0 right-0 z-[101]',
              'w-full sm:w-[420px] max-w-full',
              'flex flex-col',
              !isDark && (isGrey ? 'bg-muted' : 'bg-[#f8fafc]')
            )}
            style={isDark ? {
              background: '#0d0d0d',
            } : undefined}
          >
            {/* Vignette overlay - darkens edges (matches /auth page) */}
            {isDark && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.35) 100%)',
                }}
              />
            )}
            
            {/* Ultra-fine grain texture overlay (matches /auth page) */}
            {isDark && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />
            )}
            
            {/* Header - Centered clean design */}
            <div 
              className={cn(
                "relative z-10 flex-shrink-0 pt-[max(env(safe-area-inset-top,0px),47px)] border-b",
                isDark ? "border-white/8" : "border-border/50"
              )}
              style={isDark ? {
                background: 'rgba(13, 13, 13, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              } : undefined}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "p-3 -ml-3 rounded-full transition-colors",
                    isDark ? "hover:bg-white/10" : "hover:bg-muted/50"
                  )}
                >
                  <ChevronLeft className={cn(
                    "w-5 h-5",
                    isDark ? "text-white" : "text-foreground"
                  )} />
                </button>
                
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "font-semibold text-sm",
                    isDark ? "text-white" : "text-foreground"
                  )}>
                    Comments
                  </span>
                  <span className={cn(
                    "text-xs",
                    isDark ? "text-white/50" : "text-muted-foreground"
                  )}>
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                  </span>
                </div>
                
                {/* Spacer for symmetry */}
                <div className="w-9" />
              </div>
            </div>

            {/* Comments List - 16px horizontal padding with entrance animation */}
            <motion.div 
              ref={commentsListRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: listVisible ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto pl-5 pr-4"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                paddingBottom: Math.max(16, keyboardOffset + 72), // 72px = composer height approx
              }}
            >
              {commentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={cn("text-sm", isDark ? "text-white/50" : "text-muted-foreground")}>
                    Loading comments...
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  {/* Enhanced empty state with breathing animation */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative mb-4"
                  >
                    {/* Subtle glow behind icon */}
                    <div 
                      className={cn(
                        "absolute inset-0 rounded-full blur-2xl",
                        isDark ? "bg-primary/15" : "bg-primary/10"
                      )} 
                    />
                    
                    {/* Icon container with breathing animation */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: 'easeInOut' 
                      }}
                      className={cn(
                        "relative w-16 h-16 rounded-full flex items-center justify-center",
                        isDark 
                          ? "bg-gradient-to-br from-white/8 to-white/4 border border-white/8" 
                          : "bg-muted/50 border border-border/30"
                      )}
                    >
                      <MessageCircle className={cn(
                        "w-8 h-8",
                        isDark ? "text-white/40" : "text-muted-foreground"
                      )} />
                    </motion.div>
                  </motion.div>
                  
                  <h3 className={cn(
                    "text-lg font-semibold mb-1",
                    isDark ? "text-white" : "text-foreground"
                  )}>
                    Start the conversation
                  </h3>
                  
                  <p className={cn(
                    "text-sm mb-6",
                    isDark ? "text-white/50" : "text-muted-foreground"
                  )}>
                    Be the first to share your thoughts
                  </p>
                  
                  {/* Quick reaction buttons - premium styling */}
                  <div className="flex items-center gap-2">
                    {QUICK_REACTIONS.map(emoji => (
                      <motion.button
                        key={emoji}
                        whileTap={{ scale: 0.85 }}
                        onClick={async () => {
                          triggerHaptic('success');
                          try {
                            await addComment(emoji);
                          } catch (error) {
                            console.error('Failed to add quick reaction:', error);
                          }
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-base transition-colors",
                          isDark 
                            ? "bg-white/5 hover:bg-white/10 border border-white/8" 
                            : "bg-muted/50 hover:bg-muted border border-border/30"
                        )}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {sortedComments.map((comment, index) => {
                    const repliesExpanded = expandedReplies.has(comment.id);
                    const visibleReplies = repliesExpanded 
                      ? comment.replies 
                      : comment.replies.slice(0, 2);
                    const hiddenRepliesCount = comment.replies.length - 2;
                    const isOwnComment = currentUserId === comment.user_id;
                    const isThisCaddiePick = caddiePickCommentId === comment.id;

                    return (
                      <div 
                        key={comment.id}
                        className="mb-2"
                      >
                        <CommentItem
                          comment={comment}
                          isDark={isDark}
                          isGrey={isGrey}
                          onLike={toggleCommentLike}
                          onReply={handleReply}
                          isLiking={isTogglingLike}
                          isOwnComment={isOwnComment}
                          onLongPress={handleLongPress}
                          isAuthor={creatorUserId === comment.user_id}
                          isHighlighted={highlightedCommentId === comment.id}
                          isHidden={hiddenCommentIds.has(comment.id)}
                          isRevealed={revealedCommentIds.has(comment.id)}
                          onReveal={() => revealComment(comment.id)}
                          commentRef={registerCommentRef(comment.id)}
                          isCaddiePick={isThisCaddiePick}
                          onLongPressReaction={handleOpenReactionPicker}
                          reactionCounts={getReactionsForComment(comment.id).reactions}
                          userReactions={getReactionsForComment(comment.id).userReactions}
                          onReactionToggle={(commentId, type) => toggleReaction({ commentId, reactionType: type })}
                          onMentionTap={(username) => resolveAndNavigate(username, navigate)}
                        />
                        
                        {/* Replies - thread rail layout with subtle gradient connector */}
                        {comment.replies.length > 0 && (
                          <div className="relative ml-4">
                            {/* Thread connector - gradient fade line */}
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
                            
                            {/* Thread content container */}
                            <div className="pt-1 pb-2">
                              {visibleReplies.map((reply, replyIndex) => (
                                <CommentItem
                                  key={reply.id}
                                  comment={reply}
                                  isDark={isDark}
                                  isGrey={isGrey}
                                  onLike={toggleCommentLike}
                                  isReply
                                  isLiking={isTogglingLike}
                                  showDivider={replyIndex > 0}
                                  isOwnComment={currentUserId === reply.user_id}
                                  onLongPress={handleLongPress}
                                  isAuthor={creatorUserId === reply.user_id}
                                  isHighlighted={highlightedCommentId === reply.id}
                                  isHidden={hiddenCommentIds.has(reply.id)}
                                  isRevealed={revealedCommentIds.has(reply.id)}
                                  onReveal={() => revealComment(reply.id)}
                                  commentRef={registerCommentRef(reply.id)}
                                  onLongPressReaction={handleOpenReactionPicker}
                                  reactionCounts={getReactionsForComment(reply.id).reactions}
                                  userReactions={getReactionsForComment(reply.id).userReactions}
                                  onReactionToggle={(commentId, type) => toggleReaction({ commentId, reactionType: type })}
                                  onMentionTap={(username) => resolveAndNavigate(username, navigate)}
                                />
                              ))}
                              
                              {/* Show more replies button */}
                              {hiddenRepliesCount > 0 && !repliesExpanded && (
                                <button
                                  onClick={() => toggleRepliesExpanded(comment.id)}
                                  className={cn(
                                    "relative z-10 flex items-center gap-1.5 text-[12px] font-medium py-2.5 pl-[32px] active:scale-[0.97] transition-transform",
                                    isDark ? "text-white/50 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                  View {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
                                </button>
                              )}
                              {repliesExpanded && comment.replies.length > 2 && (
                                <button
                                  onClick={() => toggleRepliesExpanded(comment.id)}
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
                </div>
              )}
            </motion.div>

            {/* Comment Input - Fixed Bottom with subtle border */}
            <motion.div 
              className="flex-shrink-0 px-4 py-3"
              style={{ 
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                background: isDark 
                  ? 'rgba(13, 13, 13, 0.98)' 
                  : isGrey 
                    ? 'rgba(248, 250, 252, 0.98)'
                    : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid hsl(var(--border) / 0.5)',
              }}
              animate={{ 
                y: -keyboardOffset 
              }}
              transition={{ 
                duration: 0.18, 
                ease: [0.4, 0, 0.2, 1] 
              }}
            >
              {/* CommentingAsIndicator - Shows when acting as business */}
              <CommentingAsIndicator isDark={isDark} />

              {/* Reply indicator bar - 28-32px height */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 28 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className={cn(
                      "flex items-center justify-between mb-2 overflow-hidden"
                    )}
                  >
                    <span className={cn(
                      "text-[13px]",
                      isDark ? "text-white/60" : "text-muted-foreground"
                    )}>
                      Replying to <span className="font-medium">{replyingTo.displayName}</span>
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className={cn(
                        "w-11 h-11 flex items-center justify-center rounded-full transition-colors -mr-1",
                        isDark ? "hover:bg-white/10" : "hover:bg-muted"
                      )}
                    >
                      <X className={cn(
                        "w-4 h-4",
                        isDark ? "text-white/60" : "text-muted-foreground"
                      )} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3">
                {/* Current user avatar */}
                <SquircleAvatar
                  size={32}
                  src={activeActor?.avatarUrl}
                  alt={activeActor?.name || 'You'}
                  fallback={activeActor?.name?.charAt(0) || '?'}
                  hideRing
                />
                
                <div className="flex-1">
                  {/* Input pill - expands subtly when typing for "you're participating" moment */}
                  <motion.div 
                    className={cn(
                      "flex items-center gap-2 rounded-[22px] pl-4 pr-3",
                      "transition-all duration-200",
                      isDark 
                        ? "bg-white/10 border border-white/15 focus-within:border-white/25 focus-within:bg-white/12" 
                        : "bg-background border border-border/50 focus-within:border-border focus-within:shadow-sm"
                    )}
                    animate={{ 
                      height: newComment.trim() ? 48 : 44,
                    }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={replyingTo ? `Reply to ${replyingTo.displayName}...` : "Add a comment... (@ to mention)"}
                      value={newComment}
                      onChange={handleCommentChange}
                      onKeyDown={handleKeyPress}
                      onFocus={() => setShowEmojiPicker(false)}
                      className={cn(
                        'flex-1 bg-transparent',
                        'text-[14px]',
                        'outline-none border-none',
                        isDark 
                          ? 'text-white placeholder:text-white/40' 
                          : 'text-foreground placeholder:text-muted-foreground'
                      )}
                    />
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={cn(
                        "w-11 h-11 flex items-center justify-center rounded-full transition-colors emoji-button",
                        isDark 
                          ? "text-white/40 hover:text-white/60" 
                          : "text-muted-foreground hover:text-foreground",
                        showEmojiPicker && (isDark ? "text-white/80" : "text-foreground")
                      )}
                    >
                      <Smile className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </div>
                
                {/* Send button - emphasis state when content present */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  animate={{ 
                    rotate: isAddingComment ? 45 : 0,
                    scale: newComment.trim() ? 1.02 : 1,
                  }}
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className={cn(
                    'w-11 h-11 rounded-full relative overflow-hidden',
                    'flex items-center justify-center',
                    'transition-all duration-200',
                    newComment.trim() 
                      ? isDark 
                        ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/15' 
                        : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
                      : isDark 
                        ? 'bg-white/12 text-white/35' 
                        : 'bg-muted text-muted-foreground/35',
                    'disabled:cursor-not-allowed'
                  )}
                >
                  <motion.div
                    animate={isAddingComment ? { scale: 0.9, opacity: 0.7 } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Full-screen emoji overlay - MUST be outside panel, covers entire viewport including sides */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[105]"
                style={{ pointerEvents: 'auto' }}
                onClick={() => setShowEmojiPicker(false)}
              />
            )}
          </AnimatePresence>

          {/* Emoji Picker - positioned above input, same width as input */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  "fixed right-4 z-[110] emoji-picker-container",
                  "rounded-[16px] overflow-hidden shadow-xl",
                  "sm:right-auto sm:left-[calc(100%-420px+16px)] sm:w-[calc(420px-32px)]"
                )}
                style={{ 
                  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
                  left: '16px',
                  right: '16px',
                  maxWidth: 'calc(100% - 32px)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme={isDark ? 'dark' : 'light'}
                  previewPosition="none"
                  skinTonePosition="none"
                  maxFrequentRows={2}
                  perLine={8}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mention Bottom Sheet — z-[110] sits above portal, bottomOffset keeps it above the input bar */}
          <MentionBottomSheet
            open={showMentions}
            onOpenChange={(open) => {
              console.log('[MENTION] onOpenChange called with:', open);
              setShowMentions(open);
            }}
            query={mentionQuery}
            onSelect={(mention) => {
              console.log('[MENTION] onSelect callback received in CommentsPage:', mention.name);
              handleMentionSelect(mention);
            }}
            zIndex={110}
            bottomOffset={72 + keyboardOffset}
          />

          {/* Action Sheet */}
          <AnimatePresence>
            {showActionSheet && (
              <ActionSheet
                isOpen={showActionSheet}
                onClose={() => {
                  setShowActionSheet(false);
                  setSelectedComment(null);
                }}
                isDark={isDark}
                isOwnComment={currentUserId === selectedComment?.user_id}
                onDelete={handleDelete}
                onCopy={handleCopyText}
                onReport={() => {
                  setShowActionSheet(false);
                  setShowReportModal(true);
                }}
                onBlock={() => {
                  setShowActionSheet(false);
                  setShowBlockModal(true);
                }}
                isPostAuthor={isCurrentUserPostAuthor}
                isCaddiePick={selectedComment?.id === caddiePickCommentId}
                onSetCaddiePick={() => selectedComment && setCaddiePick(selectedComment.id)}
                onRemoveCaddiePick={() => removeCaddiePick()}
              />
            )}
          </AnimatePresence>

          {/* Report Modal */}
          <AnimatePresence>
            {showReportModal && (
              <ReportModal
                isOpen={showReportModal}
                onClose={() => {
                  setShowReportModal(false);
                  setSelectedComment(null);
                }}
                onSubmit={handleReport}
                isDark={isDark}
              />
            )}
          </AnimatePresence>

          {/* Block Confirm Modal */}
          <AnimatePresence>
            {showBlockModal && selectedComment && (
              <BlockConfirmModal
                isOpen={showBlockModal}
                onClose={() => {
                  setShowBlockModal(false);
                  setSelectedComment(null);
                }}
                onConfirm={handleBlock}
                userName={selectedComment.user_name}
                isDark={isDark}
              />
            )}

            {/* Golf Reaction Picker */}
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
