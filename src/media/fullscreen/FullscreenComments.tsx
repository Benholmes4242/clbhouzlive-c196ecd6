/**
 * FullscreenComments - Comments drawer for fullscreen viewer
 * 
 * Pull-up drawer with drag-to-close gesture.
 * Includes full @mention support with autocomplete and highlighting.
 */

import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Smile } from 'lucide-react';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { CommentingAsIndicator } from '@/components/comments/CommentingAsIndicator';
import { MentionBottomSheet, MentionSuggestion } from '@/components/post/post-wizard/steps/MentionBottomSheet';
import { MentionText } from '@/components/comments/MentionText';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface FullscreenCommentsProps {
  className?: string;
}

export const FullscreenComments: React.FC<FullscreenCommentsProps> = ({
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const { currentItem, commentsOpen, setCommentsOpen } = viewer;
  
  // Comment input state
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load real comments using the postId from the current item
  const postId = currentItem?.postId || '';
  const { comments, commentsLoading, addComment, isAddingComment } = usePostEngagement(postId);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      setCommentsOpen(false);
      setShowMentions(false);
    }
  }, [setCommentsOpen]);

  const handleClose = useCallback(() => {
    setCommentsOpen(false);
    setShowMentions(false);
  }, [setCommentsOpen]);

  // Handle comment input change with @mention detection
  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);

    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  // Handle mention selection from bottom sheet
  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const displayName = mention.username || mention.name;
    const newValue = newComment.replace(/@\w*$/, `@${displayName} `);
    setNewComment(newValue);
    setShowMentions(false);
    setMentionQuery('');
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [newComment]);

  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim() || isAddingComment || !postId) return;
    addComment(newComment);
    setNewComment('');
    setShowMentions(false);
    setMentionQuery('');
  }, [newComment, isAddingComment, postId, addComment]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  }, [handleSubmitComment]);

  if (!currentItem) return null;

  return (
    <>
      {/* Trigger area at bottom - can be pulled up */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 z-30"
        onClick={() => setCommentsOpen(true)}
        style={{ touchAction: 'none' }}
      />

      {/* Comments drawer */}
      <AnimatePresence>
        {commentsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Drawer */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 flex flex-col"
              style={{ top: '30%' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted rounded-full" />
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Header */}
              <div className="px-4 py-2 border-b">
                <h3 className="text-lg font-semibold text-center">
                  {currentItem.commentCount} Comments
                </h3>
              </div>

              {/* Comments content - Scrollable */}
              <div 
                className="flex-1 overflow-y-auto p-4"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
                {commentsLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 pb-3">
                      <img
                        src={comment.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                        alt={comment.user_name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                          <span className="truncate">{comment.user_name}</span>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {/* Render comment content with @mention highlighting */}
                        <MentionText
                          text={comment.content}
                          className="mt-0.5 text-[13px] leading-snug text-foreground/85"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input */}
              <div className="border-t p-4 pb-safe">
                {/* CommentingAsIndicator - Shows when acting as business */}
                <CommentingAsIndicator isDark className="mb-2" />
                
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border-0">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={handleCommentChange}
                        onKeyDown={handleKeyPress}
                        className="flex-1 bg-transparent text-[13px] focus:outline-none focus:ring-0 border-none"
                      />
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isAddingComment}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium text-sm disabled:opacity-50"
                  >
                    {isAddingComment ? '...' : 'Post'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Mention Bottom Sheet */}
            <MentionBottomSheet
              open={showMentions}
              onOpenChange={setShowMentions}
              query={mentionQuery}
              onSelect={handleMentionSelect}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FullscreenComments;
