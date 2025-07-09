import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

const TrendingFeed = () => {
  // Sample trending posts data
  const trendingPosts = [
    {
      id: 1,
      author: "Pro Golfer Mike",
      username: "@mikepro",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      time: "2h",
      content: "Just had an incredible round at Pebble Beach! The views were absolutely stunning. Can't wait to go back! 🏌️‍♂️",
      image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500&h=400&fit=crop",
      likes: 342,
      comments: 28,
      shares: 15,
      verified: true
    },
    {
      id: 2,
      author: "Sarah Golf",
      username: "@sarahgolf",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      time: "4h",
      content: "Tips for improving your swing: Focus on your follow-through and keep your head steady. Practice makes perfect! 💪",
      likes: 156,
      comments: 12,
      shares: 8,
      verified: false
    },
    {
      id: 3,
      author: "Golf Weekly",
      username: "@golfweekly",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      time: "6h",
      content: "The Masters Tournament is just around the corner! Who's your pick for this year's champion? 🏆",
      image: "https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=500&h=400&fit=crop",
      likes: 89,
      comments: 34,
      shares: 22,
      verified: true
    }
  ];

  return (
    <div className="space-y-4">
      {trendingPosts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardContent className="p-4">
            {/* Post Header */}
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={post.avatar}
                alt={post.author}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <h3 className="font-semibold text-sm">{post.author}</h3>
                  {post.verified && (
                    <span className="text-blue-500 text-xs">✓</span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span>{post.username}</span>
                  <span>•</span>
                  <span>{post.time}</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-3">
              <p className="text-sm leading-relaxed">{post.content}</p>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-1 text-muted-foreground hover:text-red-500 transition-colors">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs">{post.likes}</span>
                </button>
                <button className="flex items-center space-x-1 text-muted-foreground hover:text-blue-500 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{post.comments}</span>
                </button>
                <button className="flex items-center space-x-1 text-muted-foreground hover:text-green-500 transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">{post.shares}</span>
                </button>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TrendingFeed;