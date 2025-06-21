
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Heart, MessageCircle, Share, MoreHorizontal, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TaggedText from './TaggedText';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostModalData {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
  post_tags: PostTag[];
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostModalData | null;
  isOwnPost?: boolean;
}

const PostModal = ({ isOpen, onClose, post, isOwnPost = false }: PostModalProps) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!post) return null;

  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const hasMultipleMedia = post.post_media && post.post_media.length > 1;
  const currentMedia = post.post_media?.[currentMediaIndex];

  const nextMedia = () => {
    if (hasMultipleMedia) {
      setCurrentMediaIndex((prev) => (prev + 1) % post.post_media.length);
    }
  };

  const prevMedia = () => {
    if (hasMultipleMedia) {
      setCurrentMediaIndex((prev) => (prev - 1 + post.post_media.length) % post.post_media.length);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  const renderMedia = (media: PostMedia, isFullscreenMode = false) => {
    const containerClass = isFullscreenMode 
      ? "w-full h-full flex items-center justify-center"
      : "w-full h-full flex items-center justify-center";

    if (media.media_type === 'image') {
      return (
        <div className={containerClass}>
          <img
            src={media.media_url}
            alt="Post content"
            className={`${isFullscreenMode ? 'max-w-full max-h-full' : 'w-full h-full'} object-contain`}
          />
        </div>
      );
    } else {
      return (
        <div className={containerClass}>
          <video
            src={media.media_url}
            controls
            autoPlay
            muted={!isFullscreenMode}
            className={`${isFullscreenMode ? 'max-w-full max-h-full' : 'w-full h-full'} object-contain`}
          >
            Your browser does not support the video tag.
          </video>
          {!isFullscreenMode && (
            <Button
              onClick={handleFullscreen}
              className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/80 rounded-full p-2"
              size="icon"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }
  };

  // Fullscreen modal
  if (isFullscreen && currentMedia?.media_type === 'video') {
    return (
      <Dialog open={isFullscreen} onOpenChange={handleExitFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black">
          <div className="relative w-full h-full">
            {renderMedia(currentMedia, true)}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full"
                onClick={handleExitFullscreen}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Media Section */}
          <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
            {post.post_media && post.post_media.length > 0 ? (
              <div className="relative w-full h-full">
                {renderMedia(currentMedia)}

                {/* Navigation arrows for multiple media */}
                {hasMultipleMedia && (
                  <>
                    <Button
                      onClick={prevMedia}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/80 rounded-full p-2 z-10"
                      size="icon"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={nextMedia}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/80 rounded-full p-2 z-10"
                      size="icon"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Media indicators */}
                {hasMultipleMedia && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {post.post_media.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMediaIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center text-white/60 h-full">
                No media available
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="w-full md:w-80 lg:w-96 bg-white flex flex-col max-h-[40vh] md:max-h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <img
                  src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <span className="font-semibold text-sm">{displayName}</span>
                  <div className="text-xs text-muted-foreground">{timeAgo}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {post.content && (
                <div className="text-sm mb-4">
                  <TaggedText text={post.content} tags={post.post_tags} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t shrink-0">
              <div className="flex items-center space-x-4 mb-3">
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
          </div>
        </div>

        {/* Close button */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full md:text-black md:bg-white/80 md:hover:bg-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default PostModal;
