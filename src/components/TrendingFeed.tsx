import React, { useState, useEffect } from 'react';
import { Play, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import VideoPlayer from './VideoPlayer';

interface VideoPost {
  id: string;
  type: 'youtube' | 'friend' | 'post';
  user: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: {
    type: 'video' | 'image';
    description: string;
    thumbnail?: string;
    image?: string;
    duration?: string;
    videoUrl?: string;
    youtubeId?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  timeAgo: string;
}

const TrendingFeed = () => {
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoPlayer, setVideoPlayer] = useState<{
    isOpen: boolean;
    youtubeId?: string;
    videoUrl?: string;
  }>({
    isOpen: false,
  });

  // Static posts for now (original content)
  const staticPosts: VideoPost[] = [
    {
      id: '1',
      type: 'post',
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
      id: '2',
      type: 'post',
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
  ];

  const fetchYouTubeVideos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-videos');
      
      if (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
      }
      
      return data?.videos || [];
    } catch (error) {
      console.error('Error calling YouTube function:', error);
      return [];
    }
  };

  const fetchFriendVideos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-friend-videos');
      
      if (error) {
        console.error('Error fetching friend videos:', error);
        return [];
      }
      
      return data?.videos || [];
    } catch (error) {
      console.error('Error calling friend videos function:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      
      // Fetch YouTube and friend videos in parallel
      const [youtubeVideos, friendVideos] = await Promise.all([
        fetchYouTubeVideos(),
        fetchFriendVideos()
      ]);
      
      // Combine all posts and sort by recency
      const allPosts = [...staticPosts, ...youtubeVideos, ...friendVideos];
      setPosts(allPosts);
      setLoading(false);
    };

    loadContent();
  }, []);

  const handleVideoClick = (post: VideoPost) => {
    setVideoPlayer({
      isOpen: true,
      youtubeId: post.content.youtubeId,
      videoUrl: post.content.videoUrl,
    });
  };

  const closeVideoPlayer = () => {
    setVideoPlayer({ isOpen: false });
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm animate-pulse">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
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
                      {post.type === 'youtube' && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">YouTube</span>
                      )}
                      {post.type === 'friend' && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Friend</span>
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
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => handleVideoClick(post)}
                  >
                    <img
                      src={post.content.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
                      <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-green-600 fill-current" />
                      </div>
                    </div>
                    {post.content.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {post.content.duration}
                      </div>
                    )}
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
      
      <VideoPlayer
        isOpen={videoPlayer.isOpen}
        onClose={closeVideoPlayer}
        youtubeId={videoPlayer.youtubeId}
        videoUrl={videoPlayer.videoUrl}
      />
    </>
  );
};

export default TrendingFeed;
