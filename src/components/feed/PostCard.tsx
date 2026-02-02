
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
    images?: string[];
    duration?: string;
    videoUrl?: string;
    youtubeId?: string;
    golfCourse?: {
      id: string;
      name: string;
      country: string;
      region?: string;
    };
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  timeAgo: string;
  golfClubTags?: {
    id: string;
    entity_type: 'golf_club';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
}

interface PostCardProps {
  post: VideoPost;
}

const PostCard = React.memo(({ post }: PostCardProps) => {
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
          golfClubTags={post.golfClubTags || []}
        />

        <div className="flex items-center justify-between">
          <PostActions 
            stats={post.stats} 
            isVideoPost={post.content.type === 'video'}
          />
        </div>
      </div>
    </Card>
  );
});

export default PostCard;
