import React, { useState } from 'react';
import { X, Heart, Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Comment {
  id: string;
  user: {
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

// Mock comments data
const generateMockComments = (postId: string): Comment[] => {
  const mockComments: Comment[] = [
    {
      id: '1',
      user: {
        username: 'golfpro_mike',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Amazing shot! What club did you use? That trajectory looks perfect for this hole.',
      timestamp: '2h',
      likes: 12,
      isLiked: false
    },
    {
      id: '2',
      user: {
        username: 'sarah_golf',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b950?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Beautiful course! Need to play here soon 🏌️‍♀️',
      timestamp: '4h',
      likes: 8,
      isLiked: true
    },
    {
      id: '3',
      user: {
        username: 'clubhouse_tom',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Incredible view from the tee! 🔥',
      timestamp: '6h',
      likes: 15,
      isLiked: false
    },
    {
      id: '4',
      user: {
        username: 'jenny_links',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Love this, Rahul! Your swing has improved so much since last season. Keep it up! 💪',
      timestamp: '8h',
      likes: 23,
      isLiked: true
    },
    {
      id: '5',
      user: {
        username: 'pro_caddie_steve',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Thanks for sharing, Rahul! This is exactly the kind of approach shot I was telling you about.',
      timestamp: '1d',
      likes: 31,
      isLiked: false
    },
    {
      id: '6',
      user: {
        username: 'golf_enthusiast_lisa',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Stunning xx',
      timestamp: '1d',
      likes: 5,
      isLiked: true
    },
    {
      id: '7',
      user: {
        username: 'fairway_finder',
        avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Great progress level view. Here is my approach to the same hole from last week.',
      timestamp: '2d',
      likes: 18,
      isLiked: false
    }
  ];

  // Return different comments based on postId for variety
  const startIndex = parseInt(postId.slice(-1) || '0') % 3;
  return mockComments.slice(0, 5 + startIndex);
};

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, postId }) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(() => generateMockComments(postId));

  const handleLike = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          }
        : comment
    ));
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      user: {
        username: 'you',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      content: newComment,
      timestamp: 'now',
      likes: 0,
      isLiked: false
    };
    
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Comments Sheet - Dark Glass */}
      <div className="fixed inset-x-0 bottom-0 z-[60] flex items-end justify-center">
        <div 
          className="clubhouse-comments-sheet glass-dark rounded-t-[24px] flex flex-col relative w-full"
          style={{ 
            paddingBottom: 'env(safe-area-inset-bottom)',
            height: '80vh',
            maxHeight: '80vh'
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 pb-3 border-b border-white/5">
            <h2 className="text-[14px] font-semibold text-white">Comments</h2>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close comments"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Comments List - Scrollable */}
          <div 
            className="clubhouse-comments-scroll flex-1 overflow-y-auto px-4 md:px-6 py-3"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 pb-3">
                <img
                  src={comment.user.avatar}
                  alt={comment.user.username}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[13px] text-white font-semibold">
                    <span className="truncate">{comment.user.username}</span>
                    <span className="text-[11px] text-white/50 whitespace-nowrap">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-white/85">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors"
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="text-[11px] text-white/60 hover:text-white transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input - Fixed Bottom */}
          <div className="border-t border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-6 py-3">
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
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Leave your thoughts here..."
                    className="w-full bg-transparent text-[13px] text-white/90 placeholder:text-white/45 outline-none"
                  />
                  <button
                    type="button"
                    className="text-white/60 hover:text-white/90 transition-colors"
                  >
                    <span className="text-[14px]">@</span>
                  </button>
                </div>
              </div>
              
              {/* Send button - frosted white */}
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="btn-frosted-white h-9 w-9 flex items-center justify-center rounded-full bg-white/16 backdrop-blur-[18px] border border-white/45 text-white shadow-[0_0_12px_rgba(0,0,0,0.35)] transition-all duration-150 hover:bg-white/22 hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send comment"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentsModal;