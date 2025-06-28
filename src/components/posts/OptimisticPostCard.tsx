
import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OptimisticPost {
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
    uploading?: boolean;
  }[];
  post_tags: any[];
  uploading?: boolean;
  uploadFailed?: boolean;
}

interface OptimisticPostCardProps {
  post: OptimisticPost;
  onRetry: () => void;
}

const OptimisticPostCard = ({ post, onRetry }: OptimisticPostCardProps) => {
  const hasVideos = post.post_media.some(media => media.media_type === 'video');
  
  return (
    <Card className="border-0 shadow-sm">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user.profile_photo_url || undefined} />
            <AvatarFallback>
              {post.user.display_name?.[0] || post.user.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">
                {post.user.display_name || post.user.username || 'User'}
              </h3>
              {post.uploadFailed && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {post.uploadFailed ? 'Upload failed' : hasVideos ? 'Uploading video...' : 'Posting...'}
            </p>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm mb-3">{post.content}</p>
        )}

        {/* Media Preview */}
        {post.post_media.length > 0 && (
          <div className="relative mb-3">
            {post.post_media[0].media_type === 'video' ? (
              <video
                src={post.post_media[0].media_url}
                className="w-full aspect-video object-cover rounded-lg"
                muted
                controls={false}
              />
            ) : (
              <img
                src={post.post_media[0].media_url}
                alt="Post content"
                className="w-full aspect-square object-cover rounded-lg"
              />
            )}
            
            {/* Overlay for uploading state */}
            {(post.uploading || post.uploadFailed) && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  {post.uploadFailed ? (
                    <div className="space-y-2">
                      <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
                      <p className="text-sm">Upload failed</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onRetry}
                        className="gap-2"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </Button>
                    </div>
                  ) : hasVideos ? (
                    <div className="space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Processing video...</p>
                        <Progress value={undefined} className="w-32 mx-auto h-1" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto"></div>
                      <p className="text-sm">Uploading...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Status */}
        {!post.uploadFailed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full"></div>
            {hasVideos ? 'Video is being processed...' : 'Uploading post...'}
          </div>
        )}
      </div>
    </Card>
  );
};

export default OptimisticPostCard;
