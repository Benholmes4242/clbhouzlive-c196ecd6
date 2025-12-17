/**
 * CommentsPage - Full-screen slide-in comments experience
 * Slides in from right, video thumbnail pinned at top
 * Supports dark (Clubhouse) and light (Business Profile) themes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface CommentsPageProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  videoThumbnail?: string;
  creatorName?: string;
  creatorAvatar?: string;
  /** Theme variant: 'dark' for Clubhouse, 'light' for Business Profile */
  theme?: 'dark' | 'light';
}

export const CommentsPage: React.FC<CommentsPageProps> = ({
  isOpen,
  onClose,
  postId,
  videoThumbnail,
  creatorName,
  creatorAvatar,
  theme = 'dark',
}) => {
  const [newComment, setNewComment] = useState('');
  const { comments, commentsLoading, addComment, isAddingComment } = usePostEngagement(postId);

  const isLight = theme === 'light';

  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim() || isAddingComment) return;
    addComment(newComment);
    setNewComment('');
  }, [newComment, isAddingComment, addComment]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  }, [handleSubmitComment]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const content = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "fixed inset-0 z-[100] backdrop-blur-sm",
              isLight ? "bg-black/40" : "bg-black/70"
            )}
            onClick={onClose}
          />

          {/* Comments Panel - Slide from right */}
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
              isLight ? 'bg-[#f8fafc]' : 'bg-black'
            )}
          >
            {/* Header with back button and thumbnail */}
            <div className={cn(
              "flex-shrink-0 border-b",
              isLight ? "border-border/50" : "border-white/10"
            )}>
              {/* Back button row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={onClose}
                  className={cn(
                    'w-9 h-9 rounded-sq-sm',
                    'flex items-center justify-center',
                    'transition-colors',
                    isLight 
                      ? 'bg-muted hover:bg-muted/80' 
                      : 'bg-white/10 hover:bg-white/15'
                  )}
                >
                  <ChevronLeft className={cn("w-5 h-5", isLight ? "text-foreground" : "text-white")} />
                </button>
                <span className={cn(
                  "text-[15px] font-semibold",
                  isLight ? "text-foreground" : "text-white"
                )}>
                  Comments
                </span>
              </div>

              {/* Video thumbnail preview */}
              {videoThumbnail && (
                <div className="px-4 pb-3">
                  <div className={cn(
                    "flex items-center gap-3 p-2 rounded-sq-md",
                    isLight ? "bg-muted/50" : "bg-white/5"
                  )}>
                    <img
                      src={videoThumbnail}
                      alt="Video thumbnail"
                      className="w-16 h-24 object-cover rounded-sq-sm"
                    />
                    {creatorName && (
                      <div className="flex items-center gap-2">
                        <SquircleAvatar
                          size={28}
                          src={creatorAvatar}
                          alt={creatorName}
                          fallback={creatorName.charAt(0)}
                          hideRing
                        />
                        <span className={cn(
                          "text-[13px] font-medium",
                          isLight ? "text-foreground" : "text-white"
                        )}>
                          {creatorName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Comments List - Scrollable */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {commentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={cn("text-sm", isLight ? "text-muted-foreground" : "text-white/50")}>
                    Loading comments...
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={cn("text-sm mb-1", isLight ? "text-muted-foreground" : "text-white/50")}>
                    No comments yet
                  </div>
                  <div className={cn("text-xs", isLight ? "text-muted-foreground/70" : "text-white/30")}>
                    Be the first to comment!
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <SquircleAvatar
                        size={36}
                        src={comment.avatar_url}
                        alt={comment.user_name}
                        fallback={comment.user_name?.charAt(0) || '?'}
                        hideRing
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={cn(
                            "text-[13px] font-semibold",
                            isLight ? "text-foreground" : "text-white"
                          )}>
                            {comment.user_name}
                          </span>
                          <span className={cn(
                            "text-[11px]",
                            isLight ? "text-muted-foreground" : "text-white/40"
                          )}>
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn(
                          "mt-0.5 text-[13px] leading-snug",
                          isLight ? "text-foreground/85" : "text-white/85"
                        )}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input - Fixed Bottom */}
            <div 
              className={cn(
                "flex-shrink-0 border-t backdrop-blur-xl px-4 py-3",
                isLight 
                  ? "border-border/50 bg-white/80" 
                  : "border-white/10 bg-black/80"
              )}
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2.5",
                    isLight 
                      ? "bg-muted border border-border/50" 
                      : "bg-white/10 border border-white/15"
                  )}>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className={cn(
                        'flex-1 bg-transparent',
                        'text-[14px]',
                        'outline-none border-none',
                        isLight 
                          ? 'text-foreground placeholder:text-muted-foreground' 
                          : 'text-white placeholder:text-white/40'
                      )}
                    />
                    <button className={cn(
                      "transition-colors",
                      isLight 
                        ? "text-muted-foreground hover:text-foreground" 
                        : "text-white/40 hover:text-white/60"
                    )}>
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className={cn(
                    'w-10 h-10 rounded-full',
                    'flex items-center justify-center',
                    'transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    isLight 
                      ? 'bg-[#F7931E] text-white hover:bg-[#e5850f]' 
                      : 'bg-white text-black hover:bg-white/90'
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