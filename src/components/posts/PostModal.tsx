
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share, X, Edit, Trash2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TaggedText from './TaggedText';
import VideoPreview from './VideoPreview';
import EditPostDialog from './EditPostDialog';

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

interface PostData {
  id: string;
  content: string | null;
  created_at: string;
  user?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media?: PostMedia[];
  post_tags?: PostTag[];
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostData | null;
  isOwnPost?: boolean;
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

const PostModal = ({ isOpen, onClose, post, isOwnPost = false, onPostUpdated, onPostDeleted }: PostModalProps) => {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!post) return null;

  const displayName = post.user?.display_name || post.user?.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const handleDeletePost = async () => {
    if (!isOwnPost || isDeleting) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // Delete post tags first
      const { error: tagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', post.id);

      if (tagsError) throw tagsError;

      const { error: mediaError } = await supabase
        .from('post_media')
        .delete()
        .eq('post_id', post.id);

      if (mediaError) throw mediaError;

      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (postError) throw postError;

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully."
      });

      onPostDeleted?.();

    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Create a compatible post object for EditPostDialog
  const editablePost = {
    id: post.id,
    content: post.content,
    post_media: post.post_media || []
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 flex items-center justify-center">
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Close button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Options menu for own posts */}
            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="absolute top-4 left-4 z-10 text-white hover:bg-white/20"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Media Content */}
            {post.post_media && post.post_media.length > 0 ? (
              post.post_media.length > 1 ? (
                <div className="w-full h-full relative">
                  <Carousel 
                    className="w-full h-full"
                    setApi={(api) => {
                      if (api) {
                        api.on('select', () => {
                          setCurrentSlide(api.selectedScrollSnap());
                        });
                      }
                    }}
                  >
                    <CarouselContent className="h-full">
                      {post.post_media.map((media, index) => (
                        <CarouselItem key={media.id} className="h-full flex items-center justify-center">
                          <div className="w-full h-full flex items-center justify-center">
                            {media.media_type === 'image' ? (
                              <img
                                src={media.media_url}
                                alt="Post content"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
                                <VideoPreview
                                  src={media.media_url}
                                  className="w-full h-full max-w-full max-h-full"
                                  onFullscreen={() => {}}
                                  videoId={`modal-post-${post.id}-${index}`}
                                />
                              </div>
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                  
                  {/* Dot indicators */}
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {post.post_media.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {post.post_media[0].media_type === 'image' ? (
                    <img
                      src={post.post_media[0].media_url}
                      alt="Post content"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
                      <VideoPreview
                        src={post.post_media[0].media_url}
                        className="w-full h-full max-w-full max-h-full"
                        onFullscreen={() => {}}
                        videoId={`modal-post-${post.id}-0`}
                      />
                    </div>
                  )}
                </div>
              )
            ) : (
              // Text-only post
              <div className="p-8 text-white text-center">
                <div className="text-lg mb-4">
                  <TaggedText text={post.content || ''} tags={post.post_tags || []} />
                </div>
                <div className="text-sm text-white/70">
                  {displayName} • {timeAgo}
                </div>
              </div>
            )}

            {/* Action buttons at bottom */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-red-500">
                <Heart className="h-4 w-4 mr-1" />
                Like
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <MessageCircle className="h-4 w-4 mr-1" />
                Comment
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditPostDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        post={editablePost}
        onPostUpdated={onPostUpdated}
      />
    </>
  );
};

export default PostModal;
