import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

const TrendingFeed = () => {
  // Sample feed posts matching the social golf platform style
  const feedPosts = [
    {
      id: 1,
      author: "clbhouz athletes",
      username: "@clbhouzathletes",
      avatar: "/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png",
      time: "11h",
      content: "Great first day at the R&A Amateur Senior Open for clbhouz athlete @Benjamin Holmes A great round of level par, heading into day two",
      image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop",
      courseName: "R&A Golf Course",
      likes: 24,
      comments: 6,
      shares: 3,
      verified: true
    },
    {
      id: 2,
      author: "Benjamin Holmes",
      username: "@benjaminh",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      time: "2h",
      content: "Perfect conditions at @Wentworth today! The greens are running beautifully. Looking forward to tomorrow's round 🏌️‍♂️",
      image: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=600&h=400&fit=crop",
      courseName: "Wentworth Club",
      likes: 67,
      comments: 12,
      shares: 5,
      verified: false
    },
    {
      id: 3,
      author: "Simon Savage",
      username: "@simonsava",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      time: "4h",
      content: "Working on my short game this morning. Practice really does make perfect! 💪 #GolfLife #PracticeTime",
      likes: 43,
      comments: 6,
      shares: 2,
      verified: false
    },
    {
      id: 4,
      author: "Neil Bryant",
      username: "@neilbryant",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      time: "6h",
      content: "Incredible sunset round at @Sunningdale Golf Club. Sometimes golf is about more than just the score 🌅",
      image: "https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=600&h=400&fit=crop",
      courseName: "Sunningdale",
      likes: 89,
      comments: 15,
      shares: 8,
      verified: false
    }
  ];

  const renderContentWithTags = (content: string) => {
    // Convert @mentions to clickable blue links
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={index} 
            className="text-blue-500 hover:text-blue-600 cursor-pointer"
            onClick={() => console.log('Navigate to profile:', part)}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {feedPosts.map((post) => (
        <div 
          key={post.id} 
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200"
        >
          {/* Author Section */}
          <div className="flex items-start space-x-3 mb-3">
            <img
              src={post.avatar}
              alt={post.author}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <h3 className="font-semibold text-black text-sm truncate">{post.author}</h3>
                {post.verified && (
                  <span className="text-blue-500 text-xs">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{post.time}</p>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-3">
            <p className="text-sm text-gray-900 leading-relaxed">
              {renderContentWithTags(post.content)}
            </p>
          </div>

          {/* Media */}
          {post.image && (
            <div className="mb-3 relative">
              <div className="rounded-lg overflow-hidden">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-64 md:h-80 object-cover"
                />
                {/* Course Name Badge - keeping as specified */}
                {post.courseName && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {post.courseName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interaction Icons */}
          <div className="flex items-center space-x-6 pt-2">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.comments}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share2 className="h-4 w-4" />
              <span className="text-sm">{post.shares}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrendingFeed;