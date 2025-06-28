
import React from 'react';
import { Heart, MessageCircle, Share, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VideoPreview from '@/components/posts/VideoPreview';
import { MediaContentItem } from './types';

interface MediaCardProps {
  item: MediaContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow }) => {
  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow">
      {/* Content */}
      <div className="relative">
        {item.type === 'video' ? (
          <div className="relative">
            <VideoPreview
              src={item.src}
              videoId={item.id}
              className="w-full"
            />
            {item.duration && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {item.duration}
              </div>
            )}
          </div>
        ) : (
          <img
            src={item.src}
            alt={item.title}
            className="w-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Label Badge */}
        {item.label && (
          <div className="absolute top-2 left-2">
            <Badge 
              variant={item.label === 'Pro Tip' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {item.label}
            </Badge>
          </div>
        )}
      </div>

      {/* User Info & Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <img
              src={item.user.avatar}
              alt={item.user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium">{item.user.name}</p>
                {item.user.verified && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">@{item.user.username}</p>
            </div>
          </div>
          
          {!item.isFollowing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFollow(item.id)}
              className="h-7 px-3 text-xs"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Follow
            </Button>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike(item.id)}
              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm">{item.likes.toLocaleString()}</span>
            </button>
            
            <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{item.comments}</span>
            </button>
            
            <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
              <Share className="h-4 w-4" />
              <span className="text-sm">{item.shares}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
