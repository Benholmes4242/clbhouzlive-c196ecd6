
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
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
  if (!post) return null;

  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Media Section */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            {post.post_media && post.post_media.length > 0 ? (
              post.post_media.length > 1 ? (
                <Carousel className="w-full h-full">
                  <CarouselContent className="h-full">
                    {post.post_media.map((media) => (
                      <CarouselItem key={media.id} className="h-full flex items-center justify-center">
                        {media.media_type === 'image' ? (
                          <img
                            src={media.media_url}
                            alt="Post content"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <video
                            src={media.media_url}
                            controls
                            className="max-w-full max-h-full object-contain"
                            autoPlay
                            muted
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {post.post_media.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4 text-white bg-black/50 hover:bg-black/70" />
                      <CarouselNext className="right-4 text-white bg-black/50 hover:bg-black/70" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {post.post_media[0].media_type === 'image' ? (
                    <img
                      src={post.post_media[0].media_url}
                      alt="Post content"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={post.post_media[0].media_url}
                      controls
                      className="max-w-full max-h-full object-contain"
                      autoPlay
                      muted
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center text-white/60">
                No media available
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="w-96 bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
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
            <div className="p-4 border-t">
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

        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default PostModal;
