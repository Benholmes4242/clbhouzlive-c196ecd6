
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Video, Image } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OptimisticPostProps {
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
      uploading?: boolean;
    }[];
    uploading?: boolean;
    uploadFailed?: boolean;
  };
  onRetry?: () => void;
}

const OptimisticPostCard = ({ post, onRetry }: OptimisticPostProps) => {
  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  
  const hasVideos = post.post_media.some(media => media.media_type === 'video');
  const hasImages = post.post_media.some(media => media.media_type === 'image');

  const getProcessingMessage = () => {
    if (post.uploadFailed) return 'Upload failed';
    if (hasVideos && hasImages) return 'Processing media...';
    if (hasVideos) return 'Processing video...';
    if (hasImages) return 'Uploading images...';
    return 'Uploading...';
  };

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
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{displayName}</span>
                {post.uploading && !post.uploadFailed && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{getProcessingMessage()}</span>
                  </div>
                )}
                {post.uploadFailed && (
                  <div className="flex items-center space-x-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Upload failed</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          
          {post.uploadFailed && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {/* Post Content */}
        {post.content && (
          <div className="text-sm mb-3">
            {post.content}
          </div>
        )}

        {/* Post Media */}
        {post.post_media && post.post_media.length > 0 && (
          <div className="mb-3 relative">
            {post.post_media.map((media, index) => (
              <div key={media.id} className="rounded-lg overflow-hidden relative mb-2 last:mb-0">
                {media.media_type === 'image' ? (
                  <div className="relative">
                    <img
                      src={media.media_url}
                      alt="Post content"
                      className={`w-full h-80 object-cover ${post.uploading ? 'opacity-70' : ''}`}
                    />
                    {post.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-white/90 rounded-lg px-3 py-2 flex items-center space-x-2">
                          <Image className="h-4 w-4" />
                          <span className="text-sm">Processing image...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      src={media.media_url}
                      className={`w-full h-80 object-cover ${post.uploading ? 'opacity-70' : ''}`}
                      controls={!post.uploading}
                      muted
                    />
                    {post.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-white/90 rounded-lg px-3 py-2 flex items-center space-x-2">
                          <Video className="h-4 w-4" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Processing video...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Status */}
        {post.uploadFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-red-700 text-sm">
              ⚠️ Upload failed. Check your connection and file size, then try again.
            </p>
          </div>
        )}
        
        {/* Processing Status for Videos */}
        {post.uploading && hasVideos && !post.uploadFailed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-blue-700 text-sm">
              🎬 Your video is being processed and will appear shortly.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OptimisticPostCard;
