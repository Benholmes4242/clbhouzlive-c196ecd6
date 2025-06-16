
import React from 'react';
import { Card } from '@/components/ui/card';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';

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

interface PostCardProps {
  post: VideoPost;
}

const PostCard = ({ post }: PostCardProps) => {
  return (
    <Card className="border-0 shadow-sm">
      <div className="p-4">
        <PostHeader 
          user={post.user} 
          type={post.type} 
          timeAgo={post.timeAgo} 
        />
        
        <PostContent 
          content={post.content}
        />

        <div className="flex items-center justify-between">
          <PostActions stats={post.stats} />
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
