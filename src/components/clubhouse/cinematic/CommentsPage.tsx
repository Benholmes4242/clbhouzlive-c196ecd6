/**
 * CommentsPage - Full-screen slide-in comments experience
 * Slides in from right, video thumbnail pinned at top
 * Video pauses when opened
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smile, ChevronLeft } from 'lucide-react';
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
}

export const CommentsPage: React.FC<CommentsPageProps> = ({
  isOpen,
  onClose,
  postId,
  videoThumbnail,
  creatorName,
  creatorAvatar,
}) => {
  const [newComment, setNewComment] = useState('');
  const { comments, commentsLoading, addComment, isAddingComment } = usePostEngagement(postId);

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
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
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
              'bg-black',
              'flex flex-col'
            )}
          >
            {/* Header with back button and thumbnail */}
            <div className="flex-shrink-0 border-b border-white/10">
              {/* Back button row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={onClose}
                  className={cn(
                    'w-9 h-9 rounded-full',
                    'bg-white/10 hover:bg-white/15',
                    'flex items-center justify-center',
                    'transition-colors'
                  )}
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <span className="text-[15px] font-semibold text-white">
                  Comments
                </span>
              </div>

              {/* Video thumbnail preview */}
              {videoThumbnail && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-3 p-2 rounded-sq-md bg-white/5">
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
                        <span className="text-[13px] font-medium text-white">
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
                  <div className="text-white/50 text-sm">Loading comments...</div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-white/50 text-sm mb-1">No comments yet</div>
                  <div className="text-white/30 text-xs">Be the first to comment!</div>
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
                          <span className="text-[13px] font-semibold text-white">
                            {comment.user_name}
                          </span>
                          <span className="text-[11px] text-white/40">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] leading-snug text-white/85">
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
              className="flex-shrink-0 border-t border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2.5">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className={cn(
                        'flex-1 bg-transparent',
                        'text-[14px] text-white',
                        'placeholder:text-white/40',
                        'outline-none border-none'
                      )}
                    />
                    <button className="text-white/40 hover:text-white/60 transition-colors">
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
                    'bg-white text-black',
                    'flex items-center justify-center',
                    'transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'hover:bg-white/90'
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
