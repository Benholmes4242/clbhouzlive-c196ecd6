
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoPlayer from './VideoPlayer';
import PostCard from './feed/PostCard';
import LoadingSkeleton from './feed/LoadingSkeleton';

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
    return <LoadingSkeleton />;
  }

  return (
    <>
      <div className="space-y-6 pb-20">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onVideoClick={handleVideoClick}
          />
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
