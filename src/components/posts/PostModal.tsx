
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Heart, MessageCircle, Share, X, Edit, Trash2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
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
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
          <div className="flex h-full">
            {/* Media Section */}
            {post.post_media && post.post_media.length > 0 && (
              <div className="flex-1 bg-black flex items-center justify-center">
                {post.post_media.length > 1 ? (
                  <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                      {post.post_media.map((media, index) => (
                        <CarouselItem key={media.id} className="h-full flex items-center justify-center">
                          {media.media_type === 'image' ? (
                            <img
                              src={media.media_url}
                              alt="Post content"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <VideoPreview
                              src={media.media_url}
                              className="max-w-full max-h-full"
                              onFullscreen={() => {}}
                              videoId={`modal-post-${post.id}-${index}`}
                            />
                          )}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
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
                      <VideoPreview
                        src={post.post_media[0].media_url}
                        className="max-w-full max-h-full"
                        onFullscreen={() => {}}
                        videoId={`modal-post-${post.id}-0`}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content Section */}
            <div className="w-96 border-l flex flex-col">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={post.user?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-semibold text-sm">{displayName}</span>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isOwnPost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                {post.content && (
                  <div className="text-sm mb-4">
                    <TaggedText text={post.content} tags={post.post_tags || []} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-4">
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
