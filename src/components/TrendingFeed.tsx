
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from './feed/PostCard';
import UserPost from './posts/UserPost';
import LoadingSkeleton from './feed/LoadingSkeleton';
import { useUserPosts } from '@/hooks/useUserPosts';

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

interface UserPostWithType {
  id: string;
  type: 'user_post';
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }>;
}

const TrendingFeed = () => {
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { posts: userPosts, loading: userPostsLoading, refetch: refetchUserPosts } = useUserPosts();

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
      setVideoPosts(allPosts);
      setLoading(false);
    };

    loadContent();
  }, []);

  if (loading || userPostsLoading) {
    return <LoadingSkeleton />;
  }

  // Convert user posts to the correct type and combine with video posts
  const userPostsWithType: UserPostWithType[] = userPosts.map(post => ({
    ...post,
    type: 'user_post' as const
  }));

  // Create a unified content array for proper sorting
  const allContent: (VideoPost | UserPostWithType)[] = [
    ...userPostsWithType,
    ...videoPosts
  ];

  // Sort by creation time - handle both formats
  const sortedContent = allContent.sort((a, b) => {
    let dateA: Date;
    let dateB: Date;
    
    if (a.type === 'user_post') {
      dateA = new Date(a.created_at);
    } else {
      // For video posts, parse timeAgo or use current time as fallback
      dateA = new Date(); // Fallback for video posts without proper timestamps
    }
    
    if (b.type === 'user_post') {
      dateB = new Date(b.created_at);
    } else {
      dateB = new Date(); // Fallback for video posts without proper timestamps
    }
    
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6 pb-20">
      {sortedContent.map((item) => (
        item.type === 'user_post' ? (
          <UserPost key={item.id} post={item} />
        ) : (
          <PostCard key={item.id} post={item} />
        )
      ))}
    </div>
  );
};

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

export default TrendingFeed;
