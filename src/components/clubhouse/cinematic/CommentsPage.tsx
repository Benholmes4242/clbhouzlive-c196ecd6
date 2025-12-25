/**
 * CommentsPage - Full-screen slide-in comments experience
 * Final polish pass with Apple-level refinement:
 * - Premium header with tall portrait preview
 * - Consistent 8/12/16 spacing rhythm
 * - 44px tap targets throughout
 * - Refined animations and transitions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, ChevronLeft, Heart, X, MessageCircle } from 'lucide-react';
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
}

interface CommentItemProps {
  comment: CommentWithReplies | CommentReply;
  isDark: boolean;
  isGrey: boolean;
  onLike: (commentId: string) => void;
  onReply?: (commentId: string, userName: string) => void;
  isReply?: boolean;
  isLiking?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isDark,
  isGrey,
  onLike,
  onReply,
  isReply = false,
  isLiking,
}) => {
  const [showLikeAnim, setShowLikeAnim] = useState(false);

  const handleLike = () => {
    if (!comment.has_liked) {
      setShowLikeAnim(true);
      setTimeout(() => setShowLikeAnim(false), 600);
    }
    onLike(comment.id);
  };

  return (
    <div className={cn(
      "flex items-start",
      isReply ? "pl-[26px] py-2.5 gap-2.5" : "py-3 gap-2.5"
    )}>
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
            onClick={() => onReply(comment.id, comment.user_name)}
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
          <Heart
            className={cn(
              "w-[18px] h-[18px] transition-colors",
              comment.has_liked
                ? "fill-red-500 text-red-500"
                : isDark ? "text-white/50 hover:text-white/70" : "text-muted-foreground hover:text-foreground"
            )}
          />
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
    </div>
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
}) => {
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
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

  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim() || isAddingComment) return;
    addComment(newComment, replyingTo?.id);
    setNewComment('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  }, [newComment, isAddingComment, addComment, replyingTo]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  }, [handleSubmitComment]);

  const handleReply = useCallback((commentId: string, userName: string) => {
    setReplyingTo({ id: commentId, name: userName });
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
            <div className={cn(
              "flex-shrink-0 pt-[max(env(safe-area-inset-top,0px),12px)]",
              isDark ? "border-white/10" : "border-border/50"
            )}>
              {/* Back button row - 44px tap target */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
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
                </button>
                <span className={cn(
                  "text-[16px] font-semibold",
                  isDark ? "text-white" : "text-foreground"
                )}>
                  Comments
                </span>
              </div>

              {/* Post preview card - two column layout */}
              <div className="px-4 pb-3">
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
                        <div className="mt-2.5">
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Soft divider - 12px spacing below header */}
            <div className={cn(
              "h-px mx-4",
              isDark ? "bg-white/8" : "bg-border/40"
            )} />

            {/* Comments List - 16px horizontal padding */}
            <div 
              ref={commentsListRef}
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
                        />
                        
                        {/* Replies - indented from comment text start */}
                        {comment.replies.length > 0 && (
                          <div>
                            {visibleReplies.map((reply) => (
                              <CommentItem
                                key={reply.id}
                                comment={reply}
                                isDark={isDark}
                                isGrey={isGrey}
                                onLike={toggleCommentLike}
                                isReply
                                isLiking={isTogglingLike}
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
            </div>

            {/* Emoji Picker with tap-outside overlay */}
            <AnimatePresence>
              {showEmojiPicker && (
                <>
                  {/* Transparent overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-[9]"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    className={cn(
                      "absolute bottom-24 left-4 right-4 z-10 emoji-picker-container",
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
                </>
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
                    transition={{ duration: 0.15, ease: 'easeOut' }}
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
                    "transition-shadow",
                    isDark 
                      ? "bg-white/10 border border-white/15 focus-within:border-white/25" 
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
                    <button 
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
                    </button>
                  </div>
                </div>
                
                {/* Send button - consistent tap target */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className={cn(
                    'w-11 h-11 rounded-full',
                    'flex items-center justify-center',
                    'transition-all',
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
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default CommentsPage;
