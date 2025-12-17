/**
 * CommentsPage - Full-screen slide-in comments experience
 * Slides in from right, video thumbnail pinned at top
 * Supports dark (Clubhouse), light, and grey (Business Profile) themes
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
  /** Theme variant: 'dark' for Clubhouse, 'light' or 'grey' for Business Profile */
  theme?: 'dark' | 'light' | 'grey';
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

  const isDark = theme === 'dark';
  const isGrey = theme === 'grey';
  const isLightOrGrey = theme === 'light' || theme === 'grey';

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
              isDark ? "bg-black/70" : "bg-black/40"
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
              isDark ? 'bg-black' : isGrey ? 'bg-muted' : 'bg-[#f8fafc]'
            )}
          >
            {/* Header with back button and thumbnail */}
            <div className={cn(
              "flex-shrink-0 border-b",
              isDark ? "border-white/10" : "border-border/50"
            )}>
              {/* Back button row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={onClose}
                  className={cn(
                    'w-9 h-9 rounded-sq-sm',
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
                  "text-[15px] font-semibold",
                  isDark ? "text-white" : "text-foreground"
                )}>
                  Comments
                </span>
              </div>

              {/* Video thumbnail preview */}
              {videoThumbnail && (
                <div className="px-4 pb-3">
                  <div className={cn(
                    "flex items-center gap-3 p-2 rounded-sq-md",
                    isDark ? "bg-white/5" : isGrey ? "bg-background/50" : "bg-muted/50"
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
                          isDark ? "text-white" : "text-foreground"
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
                  <div className={cn("text-sm", isDark ? "text-white/50" : "text-muted-foreground")}>
                    Loading comments...
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={cn("text-sm mb-1", isDark ? "text-white/50" : "text-muted-foreground")}>
                    No comments yet
                  </div>
                  <div className={cn("text-xs", isDark ? "text-white/30" : "text-muted-foreground/70")}>
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
                            isDark ? "text-white" : "text-foreground"
                          )}>
                            {comment.user_name}
                          </span>
                          <span className={cn(
                            "text-[11px]",
                            isDark ? "text-white/40" : "text-muted-foreground"
                          )}>
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn(
                          "mt-0.5 text-[13px] leading-snug",
                          isDark ? "text-white/85" : "text-foreground/85"
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
                isDark 
                  ? "border-white/10 bg-black/80" 
                  : isGrey 
                    ? "border-border/50 bg-muted/80"
                    : "border-border/50 bg-white/80"
              )}
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2.5",
                    isDark 
                      ? "bg-white/10 border border-white/15" 
                      : "bg-background border border-border/50"
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
                        isDark 
                          ? 'text-white placeholder:text-white/40' 
                          : 'text-foreground placeholder:text-muted-foreground'
                      )}
                    />
                    <button className={cn(
                      "transition-colors",
                      isDark 
                        ? "text-white/40 hover:text-white/60" 
                        : "text-muted-foreground hover:text-foreground"
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