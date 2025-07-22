import React, { useState } from 'react';
import { X, Send, Heart } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postAuthor?: {
    name: string;
    username?: string;
    avatar?: string;
  };
}

const CommentsModal: React.FC<CommentsModalProps> = ({ 
  isOpen, 
  onClose, 
  postId, 
  postAuthor 
}) => {
  const { user } = useSupabaseSession();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    // Mock comments for now
    {
      id: '1',
      user: {
        id: '1',
        name: 'Sarah Johnson',
        username: 'sarahj_golf',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Amazing shot! What club did you use?',
      createdAt: '2h',
      likes: 12,
      isLiked: false
    },
    {
      id: '2',
      user: {
        id: '2',
        name: 'Mike Chen',
        username: 'mike_golfer',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      content: 'This course looks incredible! Where is this?',
      createdAt: '4h',
      likes: 8,
      isLiked: true
    },
    {
      id: '3',
      user: {
        id: '3',
        name: 'Emma Davis',
        username: 'emma_golf',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Great form! Been working on my swing and this is inspiring 🏌️‍♀️',
      createdAt: '6h',
      likes: 15,
      isLiked: false
    }
  ]);

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: {
        id: user.id,
        name: user.user_metadata?.full_name || 'You',
        username: user.user_metadata?.username,
        avatar: user.user_metadata?.avatar_url
      },
      content: newComment,
      createdAt: 'now',
      likes: 0,
      isLiked: false
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-x-0 bottom-0 bg-background rounded-t-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <img
                src={comment.user.avatar || '/placeholder.svg'}
                alt={comment.user.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  {comment.user.username && (
                    <span className="text-muted-foreground text-xs">@{comment.user.username}</span>
                  )}
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-muted-foreground text-xs">{comment.createdAt}</span>
                </div>
                <p className="text-sm mt-1 break-words">{comment.content}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Heart 
                      className={`w-4 h-4 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                    {comment.likes > 0 && (
                      <span className="text-xs">{comment.likes}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex space-x-3">
              <img
                src={user.user_metadata?.avatar_url || '/placeholder.svg'}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <div className="flex-1">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-accent/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsModal;