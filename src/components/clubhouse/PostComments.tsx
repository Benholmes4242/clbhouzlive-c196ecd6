import React from 'react';

interface Comment {
  id: string;
  user: {
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
}

interface PostCommentsProps {
  postId: string;
  totalComments: number;
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
      content: 'Amazing shot! What club did you use?',
      timestamp: '2h'
    },
    {
      id: '2',
      user: {
        username: 'sarah_golf',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b950?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Beautiful course! Need to play here soon 🏌️‍♀️',
      timestamp: '4h'
    },
    {
      id: '3',
      user: {
        username: 'clubhouse_tom',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Incredible view from the tee! 🔥',
      timestamp: '6h'
    }
  ];

  // Return different comments based on postId for variety
  const startIndex = parseInt(postId.slice(-1) || '0') % 3;
  return mockComments.slice(0, 2 + startIndex);
};

const PostComments: React.FC<PostCommentsProps> = ({ postId, totalComments }) => {
  const comments = generateMockComments(postId);
  const displayedComments = comments.slice(0, 1); // Show max 1 comment
  const hasMoreComments = totalComments > displayedComments.length;

  if (totalComments === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {/* View all comments link */}
      {hasMoreComments && (
        <button className="text-white/70 text-sm hover:text-white transition-colors">
          View all {totalComments} comments
        </button>
      )}
      
      {/* Display comments */}
      {displayedComments.map((comment) => (
        <div key={comment.id} className="flex items-start space-x-3">
          <img
            src={comment.user.avatar}
            alt={comment.user.username}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <span className="font-semibold text-white mr-2">
                {comment.user.username}
              </span>
              <span className="text-white/90">
                {comment.content}
              </span>
            </div>
            <span className="text-xs text-white/60 mt-1">
              {comment.timestamp}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostComments;