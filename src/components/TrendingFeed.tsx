import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

const TrendingFeed = () => {
  // Sample feed posts matching the social golf platform style
  const feedPosts = [
    {
      id: 1,
      author: "clbhouz athletes",
      username: "@clbhouzathletes",
      avatar: "/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png",
      time: "about 11 hours ago",
      content: "Great first day at the R&A Amateur Senior Open for clbhouz athlete @dannyholmes A great round of level par, heading into day two",
      image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop",
      likes: 24,
      comments: 8,
      shares: 3,
      verified: true
    },
    {
      id: 2,
      author: "Benjamin H.",
      username: "@benjaminh",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      time: "2 hours ago",
      content: "Perfect conditions at Wentworth today! The greens are running beautifully. Looking forward to tomorrow's round 🏌️‍♂️",
      image: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=600&h=400&fit=crop",
      likes: 67,
      comments: 12,
      shares: 5,
      verified: false
    },
    {
      id: 3,
      author: "Simon Sava",
      username: "@simonsava",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      time: "4 hours ago",
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
      time: "6 hours ago",
      content: "Incredible sunset round at the local course. Sometimes golf is about more than just the score 🌅",
      image: "https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=600&h=400&fit=crop",
      likes: 89,
      comments: 15,
      shares: 8,
      verified: false
    }
  ];

  return (
    <div className="space-y-6">
      {feedPosts.map((post) => (
        <Card key={post.id} className="overflow-hidden border border-border">
          <CardContent className="p-0">
            {/* Post Header */}
            <div className="p-4 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={post.avatar}
                  alt={post.author}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    <h3 className="font-semibold text-sm text-foreground">{post.author}</h3>
                    {post.verified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{post.time}</p>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-3">
              <p className="text-sm leading-relaxed text-foreground">{post.content}</p>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="px-4 pb-3">
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={post.image}
                    alt="Post content"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-muted-foreground hover:text-green-500 transition-colors">
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">{post.shares}</span>
                  </button>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TrendingFeed;