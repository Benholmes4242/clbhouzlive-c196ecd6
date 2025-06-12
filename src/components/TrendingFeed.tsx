
import React from 'react';
import { Play, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TrendingFeed = () => {
  const posts = [
    {
      id: 1,
      user: {
        name: 'Tiger Woods',
        username: '@tigerwoods',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        verified: true,
      },
      content: {
        type: 'video',
        description: 'Perfect your putting technique with this simple drill 🏌️‍♂️',
        thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&h=400&fit=crop',
        duration: '2:45',
      },
      stats: {
        likes: 12500,
        comments: 450,
        shares: 230,
      },
      timeAgo: '2h',
    },
    {
      id: 2,
      user: {
        name: 'Golf Digest',
        username: '@golfdigest',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true,
      },
      content: {
        type: 'image',
        description: 'Stunning sunrise at Augusta National 🌅 The course is looking magnificent for the upcoming tournament!',
        image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
      },
      stats: {
        likes: 8900,
        comments: 230,
        shares: 156,
      },
      timeAgo: '4h',
    },
    {
      id: 3,
      user: {
        name: 'Amateur Golfer UK',
        username: '@amateurgolferuk',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        verified: false,
      },
      content: {
        type: 'video',
        description: 'Finally broke 80! Here\'s the shot that sealed it 🎯',
        thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cec4674?w=600&h=400&fit=crop',
        duration: '1:20',
      },
      stats: {
        likes: 2400,
        comments: 89,
        shares: 45,
      },
      timeAgo: '6h',
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {posts.map((post) => (
        <Card key={post.id} className="border-0 shadow-sm">
          <div className="p-4">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-sm">{post.user.name}</span>
                    {post.user.verified && (
                      <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{post.user.username} • {post.timeAgo}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Post Content */}
            <p className="text-sm mb-3">{post.content.description}</p>
            
            <div className="relative rounded-lg overflow-hidden mb-3">
              {post.content.type === 'video' ? (
                <div className="relative">
                  <img
                    src={post.content.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3">
                      <Play className="h-6 w-6 text-green-600 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {post.content.duration}
                  </div>
                </div>
              ) : (
                <img
                  src={post.content.image}
                  alt="Post content"
                  className="w-full h-80 object-cover"
                />
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                  <Heart className="h-4 w-4 mr-1" />
                  {post.stats.likes.toLocaleString()}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.stats.comments}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Share className="h-4 w-4 mr-1" />
                  {post.stats.shares}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TrendingFeed;
