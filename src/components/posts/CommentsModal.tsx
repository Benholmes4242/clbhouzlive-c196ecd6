import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Z } from '@/config/zIndex';
import { cn } from '@/lib/utils';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { formatDistanceToNow } from 'date-fns';
import { CommentingAsIndicator } from '@/components/comments/CommentingAsIndicator';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  theme?: 'dark' | 'grey';
}

// Animation constants - matches expanded map sheet
const ENTRY_DURATION = 500;
const EXIT_DURATION = 500;

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, postId, theme = 'dark' }) => {
  const [newComment, setNewComment] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  
  const { comments, commentsLoading, addComment, isAddingComment } = usePostEngagement(postId);

  const handleSubmitComment = () => {
    if (!newComment.trim() || isAddingComment) return;
    addComment(newComment);
    setNewComment('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setHasEntered(false);
    }, EXIT_DURATION);
  };

  // Slide-in animation on mount
  React.useEffect(() => {
    if (isOpen && !isClosing) {
      // Slight delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setHasEntered(true);
      });
    }
  }, [isOpen, isClosing]);

  if (!isOpen && !isClosing) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: Z.sheetBackdrop }}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity ease-in-out",
          hasEntered && !isClosing ? "opacity-100 duration-500" : "opacity-0 duration-500"
        )}
        onClick={handleClose}
      />
      
      {/* Comments Sheet - Supports dark and grey themes */}
      <div 
        className="absolute inset-x-0 bottom-0 flex items-end justify-center"
        style={{ zIndex: Z.sheet }}
      >
        <div 
          className={cn(
            "clubhouse-comments-sheet rounded-t-[24px] flex flex-col w-full",
            "transition-all ease-in-out",
            hasEntered && !isClosing ? "duration-500 translate-y-0 opacity-100" : "duration-500 translate-y-4 opacity-0",
            theme === 'grey' 
              ? "bg-[#FAFAFB] border-t border-border/30" 
              : "glass-dark"
          )}
          style={{ 
            paddingBottom: 'env(safe-area-inset-bottom)',
            maxHeight: '72vh',
            width: '100%',
            maxWidth: '100vw',
            boxShadow: 'none'
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className={cn("w-12 h-1 rounded-full", theme === 'grey' ? "bg-border" : "bg-white/30")} />
          </div>

          {/* Header */}
          <div className={cn("flex items-center justify-center px-4 md:px-6 pb-3 border-b", theme === 'grey' ? "border-border/50" : "border-white/5")}>
            <h2 className={cn("text-[14px] font-semibold", theme === 'grey' ? "text-foreground" : "text-white")}>Comments</h2>
          </div>

          {/* Comments List - Scrollable */}
          <div 
            className="clubhouse-comments-scroll flex-1 overflow-y-auto px-4 md:px-6 py-3"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className={cn("text-sm", theme === 'grey' ? "text-muted-foreground" : "text-white/50")}>Loading comments...</div>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className={cn("text-sm", theme === 'grey' ? "text-muted-foreground" : "text-white/50")}>No comments yet. Be the first!</div>
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
                    <div className={cn("flex items-center gap-2 text-[13px] font-semibold", theme === 'grey' ? "text-foreground" : "text-white")}>
                      <span className="truncate">{comment.user_name}</span>
                      <span className={cn("text-[11px] whitespace-nowrap", theme === 'grey' ? "text-muted-foreground" : "text-white/50")}>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn("mt-0.5 text-[13px] leading-snug", theme === 'grey' ? "text-foreground/85" : "text-white/85")}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input - Fixed Bottom */}
          <div className="border-t border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-6 py-3">
            {/* CommentingAsIndicator - Shows when acting as business */}
            <CommentingAsIndicator isDark={theme === 'dark'} className="mb-2" />
            
            <div className="flex items-center gap-2">
              {/* User avatar */}
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              
              {/* Input pill */}
              <div className="flex-1">
                <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/50 outline-none border-none"
                    style={{ caretColor: 'white' }}
                  />
                  <button className="text-white/50 hover:text-white transition-colors">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Send button - Frosted White */}
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isAddingComment}
                className="btn-frosted-white px-4 py-1.5 text-[13px] font-semibold rounded-full bg-white/16 backdrop-blur-[18px] border border-white/45 text-white shadow-[0_0_12px_rgba(0,0,0,0.35)] transition-all duration-150 hover:bg-white/22 hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingComment ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default CommentsModal;