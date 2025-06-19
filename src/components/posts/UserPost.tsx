
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface UserPostData {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
}

interface UserPostProps {
  post: UserPostData;
}

const UserPost = ({ post }: UserPostProps) => {
  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="border-0 shadow-sm">
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <img
              src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-sm">{displayName}</span>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Friend</span>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        {post.content && (
          <p className="text-sm mb-3">{post.content}</p>
        )}

        {/* Post Media */}
        {post.post_media && post.post_media.length > 0 && (
          <div className="space-y-2 mb-3">
            {post.post_media.map((media) => (
              <div key={media.id} className="rounded-lg overflow-hidden">
                {media.media_type === 'image' ? (
                  <img
                    src={media.media_url}
                    alt="Post content"
                    className="w-full h-80 object-cover"
                  />
                ) : (
                  <video
                    src={media.media_url}
                    controls
                    className="w-full h-80 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center space-x-4 pt-2 border-t">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
            <Heart className="h-4 w-4 mr-1" />
            Like
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MessageCircle className="h-4 w-4 mr-1" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UserPost;
