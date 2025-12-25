/**
 * CommentsPage - Full-screen slide-in comments experience
 * Final polish pass with Apple-level refinement:
 * - Premium header with tall portrait preview
 * - Consistent 8/12/16 spacing rhythm
 * - 44px tap targets throughout
 * - Refined animations and transitions
 * - Subtle haptics and micro-interactions
 * - One-level reply threading with dividers
 * - Moderation/reporting UX
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, ChevronLeft, Heart, X, MessageCircle, MoreHorizontal, Copy, Flag, Ban, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommentsWithReplies, CommentWithReplies, CommentReply } from '@/hooks/useCommentsWithReplies';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

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
}) => {
  const [showLikeAnim, setShowLikeAnim] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const handleLike = () => {
    if (!comment.has_liked) {
      setShowLikeAnim(true);
      setTimeout(() => setShowLikeAnim(false), 600);
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

  return (
    <>
      {/* Subtle divider between replies only */}
      {showDivider && (
        <div 
          className={cn(
            "h-px ml-[62px] mr-4",
            isDark ? "bg-white/8" : "bg-border/20"
          )}
        />
      )}
      <motion.div 
        className={cn(
          "flex items-start select-none",
          isReply ? "pl-[26px] py-2.5 gap-2.5" : "py-3 gap-2.5",
          isPressing && "opacity-75"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          onLongPress?.(comment);
        }}
      >
        <SquircleAvatar
          size={isReply ? 26 : 32}
          src={comment.avatar_url}
          alt={comment.user_name}
          fallback={comment.user_name?.charAt(0) || '?'}
          hideRing
        />
        <div className="flex-1 min-w-0">
          {/* Name + Timestamp row - same baseline */}
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-[15px] font-semibold truncate",
              isReply ? "max-w-[120px]" : "max-w-[160px]",
              isDark ? "text-white" : "text-foreground"
            )}>
              {comment.user_name}
            </span>
            <span className={cn(
              "text-[12px] flex-shrink-0",
              isDark ? "text-white/55" : "text-muted-foreground/75"
            )}>
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {/* Comment body - 3px gap from name row */}
          <p className={cn(
            "mt-[3px] text-[14px] leading-[18px]",
            isDark ? "text-white/85" : "text-foreground/85"
          )}>
            {comment.content}
          </p>
          
          {/* Reply action - 6px gap, consistent alignment */}
          {!isReply && onReply && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onReply(comment.id, comment.user_name);
              }}
              className={cn(
                "mt-1.5 text-[12px] font-medium transition-colors",
                isDark ? "text-white/50 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Reply
            </button>
          )}
        </div>

        {/* Like button - fixed 44px width for consistent alignment */}
        <div className="flex flex-col items-center w-11 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLike}
            disabled={isLiking}
            className="relative w-11 h-11 flex items-center justify-center"
          >
            <AnimatePresence>
              {showLikeAnim && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              animate={comment.has_liked ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.15 }}
            >
              <Heart
                className={cn(
                  "w-[18px] h-[18px] transition-colors",
                  comment.has_liked
                    ? "fill-red-500 text-red-500"
                    : isDark ? "text-white/50 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
                )}
              />
            </motion.div>
          </motion.button>
          {comment.likes_count > 0 && (
            <span className={cn(
              "text-[11px] -mt-2",
              isDark ? "text-white/55" : "text-muted-foreground"
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
}) => {
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [selectedComment, setSelectedComment] = useState<CommentWithReplies | CommentReply | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const {
    comments,
    commentsLoading,
    addComment,
    isAddingComment,
    toggleCommentLike,
    isTogglingLike,
  } = useCommentsWithReplies(postId);

  const isDark = theme === 'dark';
  const isGrey = theme === 'grey';

  // Page entrance animation - fade in list after mount
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setListVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setListVisible(false);
    }
  }, [isOpen]);

  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim() || isAddingComment) return;
    
    // For replies, always attach to top-level parent (one-level threading)
    const parentId = replyingTo?.id;
    
    addComment(newComment, parentId);
    setNewComment('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    triggerHaptic('success');
  }, [newComment, isAddingComment, addComment, replyingTo]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  }, [handleSubmitComment]);

  const handleReply = useCallback((commentId: string, userName: string) => {
    setReplyingTo({ id: commentId, name: userName });
    triggerHaptic('light');
    // Ensure cursor appears inside input field
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

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
      }
      return next;
    });
  }, []);

  const handleLongPress = useCallback((comment: CommentWithReplies | CommentReply) => {
    setSelectedComment(comment);
    setShowActionSheet(true);
  }, []);

  const handleCopyText = useCallback(() => {
    if (selectedComment?.content) {
      navigator.clipboard.writeText(selectedComment.content);
      triggerHaptic('light');
    }
  }, [selectedComment]);

  const handleReport = useCallback((reason: string, details?: string) => {
    // TODO: Implement actual report submission
    console.log('Report submitted:', { commentId: selectedComment?.id, reason, details });
  }, [selectedComment]);

  const handleBlock = useCallback(() => {
    // TODO: Implement actual block functionality
    console.log('Block user:', selectedComment?.user_name);
    setShowBlockModal(false);
    setShowActionSheet(false);
  }, [selectedComment]);

  const handleDelete = useCallback(() => {
    // TODO: Implement actual delete functionality
    console.log('Delete comment:', selectedComment?.id);
    setShowActionSheet(false);
  }, [selectedComment]);

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

  // Caption truncation logic
  const captionNeedsTruncation = caption && caption.length > 120;
  const displayCaption = expandedCaption ? caption : caption?.slice(0, 120);

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 28, 
              stiffness: 300,
              mass: 0.8
            }}
            className={cn(
              'fixed inset-y-0 right-0 z-[101]',
              'w-full sm:w-[420px] max-w-full',
              'flex flex-col',
              isDark ? 'bg-black' : isGrey ? 'bg-muted' : 'bg-[#f8fafc]'
            )}
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className={cn(
                "flex-shrink-0 pt-[max(env(safe-area-inset-top,0px),12px)]",
                isDark ? "border-white/10" : "border-border/50"
              )}
            >
              {/* Back button row - 44px tap target */}
              <div className="flex items-center gap-3 px-4 py-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={cn(
                    'w-11 h-11 rounded-full',
                    'flex items-center justify-center',
                    'transition-colors',
                    isDark 
                      ? 'bg-white/10 hover:bg-white/15' 
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <ChevronLeft className={cn("w-5 h-5", isDark ? "text-white" : "text-foreground")} />
                </motion.button>
                <span className={cn(
                  "text-[16px] font-semibold",
                  isDark ? "text-white" : "text-foreground"
                )}>
                  Comments
                </span>
              </div>

              {/* Post preview card - two column layout */}
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="px-4 pb-3"
              >
                <div className={cn(
                  "p-[14px] rounded-[18px]",
                  isDark ? "bg-white/5" : isGrey ? "bg-background/50" : "bg-muted/50"
                )}>
                  <div className="flex gap-3">
                    {/* Left column: Tall portrait rectangle (3:4 aspect) */}
                    {videoThumbnail && (
                      <div className="flex-shrink-0 self-center">
                        <img
                          src={videoThumbnail}
                          alt="Post thumbnail"
                          className="w-[96px] h-[130px] object-cover rounded-[14px]"
                        />
                      </div>
                    )}
                    
                    {/* Right column: Creator stack + caption */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Row 1: Avatar + Name (10px gap) */}
                      <div className="flex items-center gap-2.5">
                        <SquircleAvatar
                          size={34}
                          src={creatorAvatar}
                          alt={creatorName}
                          fallback={creatorName?.charAt(0) || '?'}
                          hideRing
                        />
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-[16px] font-semibold block truncate",
                            isDark ? "text-white" : "text-foreground"
                          )}>
                            {creatorName || 'Unknown'}
                          </span>
                          
                          {/* Row 2: Metadata (4px gap from name) */}
                          {(creatorHomeClub || creatorHandicap) && (
                            <span className={cn(
                              "text-[13px] block truncate mt-[2px]",
                              isDark ? "text-white/60" : "text-muted-foreground"
                            )}>
                              {[creatorHomeClub, creatorHandicap && `${creatorHandicap}`].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 3: Caption (10px gap from metadata) */}
                      {caption && (
                        <motion.div 
                          className="mt-2.5"
                          initial={false}
                          animate={{ height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className={cn(
                            "text-[14px] leading-[20px]",
                            isDark ? "text-white/75" : "text-foreground/75",
                            !expandedCaption && "line-clamp-3"
                          )}>
                            {displayCaption}
                            {captionNeedsTruncation && !expandedCaption && '...'}
                          </p>
                          {captionNeedsTruncation && (
                            <button
                              onClick={() => setExpandedCaption(!expandedCaption)}
                              className={cn(
                                "text-[12px] font-medium mt-1",
                                isDark ? "text-white/50 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {expandedCaption ? 'Less' : 'More'}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Soft divider - 12px spacing below header */}
            <div className={cn(
              "h-px mx-4",
              isDark ? "bg-white/8" : "bg-border/40"
            )} />

            {/* Comments List - 16px horizontal padding with entrance animation */}
            <motion.div 
              ref={commentsListRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: listVisible ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto px-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {commentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={cn("text-sm", isDark ? "text-white/50" : "text-muted-foreground")}>
                    Loading comments...
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className={cn(
                    "w-10 h-10 mb-3",
                    isDark ? "text-white/20" : "text-muted-foreground/30"
                  )} />
                  <div className={cn("text-sm mb-1", isDark ? "text-white/50" : "text-muted-foreground")}>
                    Be the first to comment
                  </div>
                </div>
              ) : (
                <div>
                  {comments.map((comment, index) => {
                    const repliesExpanded = expandedReplies.has(comment.id);
                    const visibleReplies = repliesExpanded 
                      ? comment.replies 
                      : comment.replies.slice(0, 2);
                    const hiddenRepliesCount = comment.replies.length - 2;
                    const isOwnComment = currentUserId === comment.user_id;

                    return (
                      <div 
                        key={comment.id}
                        className={cn(
                          index > 0 && "border-t",
                          isDark ? "border-white/8" : "border-border/30"
                        )}
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
                        />
                        
                        {/* Replies - indented from comment text start with subtle dividers */}
                        {comment.replies.length > 0 && (
                          <div>
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
                              />
                            ))}
                            
                            {/* Show more replies button */}
                            {hiddenRepliesCount > 0 && !repliesExpanded && (
                              <button
                                onClick={() => toggleRepliesExpanded(comment.id)}
                                className={cn(
                                  "text-[12px] font-medium py-2 pl-[58px]",
                                  isDark ? "text-white/55 hover:text-white/75" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                View {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
                              </button>
                            )}
                            {repliesExpanded && comment.replies.length > 2 && (
                              <button
                                onClick={() => toggleRepliesExpanded(comment.id)}
                                className={cn(
                                  "text-[12px] font-medium py-2 pl-[58px]",
                                  isDark ? "text-white/55 hover:text-white/75" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                Hide replies
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Full-screen emoji overlay - covers entire viewport */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[105]"
                  onClick={() => setShowEmojiPicker(false)}
                />
              )}
            </AnimatePresence>

            {/* Emoji Picker - positioned above input */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "absolute bottom-24 left-4 right-4 z-[110] emoji-picker-container",
                    "rounded-[16px] overflow-hidden shadow-xl"
                  )}
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

            {/* Comment Input - Fixed Bottom */}
            <div 
              className={cn(
                "flex-shrink-0 border-t backdrop-blur-xl px-4 py-3",
                isDark 
                  ? "border-white/10 bg-black/80" 
                  : isGrey 
                    ? "border-border/50 bg-muted/80"
                    : "border-border/50 bg-white/80"
              )}
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
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
                      Replying to <span className="font-medium">{replyingTo.name}</span>
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-full transition-colors -mr-1",
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
                <div className="flex-1">
                  {/* Input pill - 44px height, 22px radius */}
                  <div className={cn(
                    "flex items-center gap-2 rounded-[22px] h-[44px] pl-4 pr-3",
                    "transition-shadow duration-150",
                    isDark 
                      ? "bg-white/10 border border-white/15 focus-within:border-white/25 focus-within:bg-white/12" 
                      : "bg-background border border-border/50 focus-within:border-border focus-within:shadow-sm"
                  )}>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
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
                        "w-9 h-9 flex items-center justify-center rounded-full transition-colors emoji-button",
                        isDark 
                          ? "text-white/40 hover:text-white/60" 
                          : "text-muted-foreground hover:text-foreground",
                        showEmojiPicker && (isDark ? "text-white/80" : "text-foreground")
                      )}
                    >
                      <Smile className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
                
                {/* Send button - consistent tap target with press animation */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className={cn(
                    'w-11 h-11 rounded-full',
                    'flex items-center justify-center',
                    'transition-all duration-150',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    isDark 
                      ? 'bg-white text-black hover:bg-white/90' 
                      : 'bg-[#F7931E] text-white hover:bg-[#e5850f]'
                  )}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>

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
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default CommentsPage;
