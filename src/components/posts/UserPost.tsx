
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, MoreHorizontal, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import MediaCarousel from './MediaCarousel';
import TaggedText from './TaggedText';
import PostOptionsModal from './PostOptionsModal';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface UserPostProps {
  post: {
    id: string;
    content: string | null;
    created_at: string;
    user: {
      id: string;
      display_name: string | null;
      username: string | null;
      profile_photo_url: string | null;
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
  };
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

const UserPost: React.FC<UserPostProps> = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user } = useSupabaseSession();
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const isCurrentUser = user?.id === post.user.id;
  const displayName = post.user.display_name || post.user.username || 'User';
  const username = post.user.username || `user_${post.user.id.slice(0, 8)}`;

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const timeAgo = new Date(post.created_at).toLocaleDateString();

  const golfClubTags = post.post_tags.filter(tag => tag.entity_type === 'golf_club');

  return (
    <Card className="border-0 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar
              className="w-10 h-10"
              isCurrentUser={isCurrentUser}
              showRing={true}
            >
              <AvatarImage 
                src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                alt={displayName}
                className="object-cover object-center"
              />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{displayName}</h3>
                {golfClubTags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {golfClubTags[0].name}
                    </Badge>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">@{username} • {timeAgo}</p>
            </div>
          </div>
          {isCurrentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOptionsModal(true)}
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>

        {post.content && (
          <div className="mb-3">
            <TaggedText 
              text={post.content} 
              tags={post.post_tags} 
            />
          </div>
        )}

        {post.post_media.length > 0 && (
          <div className="mb-3">
            <MediaCarousel 
              mediaUrls={post.post_media.map(media => media.media_url)}
              mediaTypes={post.post_media.map(media => media.media_type)}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">0</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showOptionsModal && (
        <PostOptionsModal
          isOpen={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          onCameraClick={() => {}}
          onLibraryClick={() => {}}
        />
      )}
    </Card>
  );
};

export default UserPost;
