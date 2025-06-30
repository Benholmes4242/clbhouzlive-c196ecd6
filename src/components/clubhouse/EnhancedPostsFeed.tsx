
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import EnhancedPostCard from './EnhancedPostCard';
import LoadingSkeleton from '@/components/feed/LoadingSkeleton';

interface ClubhousePost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    user_type: 'individual' | 'club' | 'pro_shop' | 'academy' | 'tour_event' | 'other' | null;
    business_name: string | null;
    eg_handicap_index?: number | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }[];
  post_tags: {
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
  stats?: {
    likes: number;
    comments: number;
    views: number;
  };
}

interface EnhancedPostsFeedProps {
  posts: ClubhousePost[];
  loading: boolean;
  filter: 'trending' | 'friends' | 'videos' | 'photos' | 'courses' | 'all';
}

const EnhancedPostsFeed: React.FC<EnhancedPostsFeedProps> = ({ posts, loading, filter }) => {
  const [filteredPosts, setFilteredPosts] = useState<ClubhousePost[]>([]);

  useEffect(() => {
    let filtered = [...posts];

    switch (filter) {
      case 'trending':
        filtered = filtered.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0));
        break;
      case 'videos':
        filtered = filtered.filter(post => 
          post.post_media.some(media => media.media_type === 'video')
        );
        break;
      case 'photos':
        filtered = filtered.filter(post => 
          post.post_media.some(media => media.media_type === 'image')
        );
        break;
      case 'courses':
        filtered = filtered.filter(post => 
          post.post_tags.some(tag => tag.entity_type === 'golf_club')
        );
        break;
      case 'friends':
        // For now, show all posts - in a real app this would filter by friend connections
        break;
      default:
        // Show all posts
        break;
    }

    setFilteredPosts(filtered);
  }, [posts, filter]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No posts found for the selected filter.</p>
        <p className="text-muted-foreground text-sm mt-2">
          Try selecting a different filter or check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ scrollSnapType: 'y mandatory' }}>
      {filteredPosts.map((post, index) => (
        <div 
          key={post.id} 
          className="scroll-snap-start"
          style={{ scrollSnapAlign: 'start' }}
        >
          <EnhancedPostCard post={post} />
        </div>
      ))}
    </div>
  );
};

export default EnhancedPostsFeed;
