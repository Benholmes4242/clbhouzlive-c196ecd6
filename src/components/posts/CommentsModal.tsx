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
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-[60] animate-slide-in-up">
        <div 
          className="bg-[#1C1C1E] rounded-t-3xl shadow-2xl flex flex-col relative"
          style={{ height: '75vh', maxHeight: '75vh', marginBottom: '64px' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-500 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Comments</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3 py-3">
                <img
                  src={comment.user.avatar}
                  alt={comment.user.username}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-white text-sm">
                      {comment.user.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <Heart 
                        className={`w-4 h-4 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="text-xs text-gray-400 hover:text-white transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input - Fixed to bottom above nav bar */}
          <div className="sticky bottom-0 bg-[#1C1C1E] border-t border-gray-700 p-4 pb-6">
            <div className="flex items-center space-x-3">
              {/* User Profile Picture - Left */}
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              
              {/* Text Input - Center */}
              <div className="flex-1">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Leave your thoughts here..."
                  className="w-full bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Right Side Icons */}
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <span className="text-gray-400 text-lg">@</span>
                </button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full w-8 h-8 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentsModal;