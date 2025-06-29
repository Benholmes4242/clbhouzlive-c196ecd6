
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import EditPostDialog from './EditPostDialog';
import TaggedText from './TaggedText';
import VideoPreview from './VideoPreview';
import { showToast } from '@/utils/toast';

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
  post_tags: PostTag[];
}

interface UserPostProps {
  post: UserPostData;
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

const UserPost = ({ post, onPostUpdated, onPostDeleted }: UserPostProps) => {
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwnPost = user?.id === post.user.id;

  const handleDeletePost = async () => {
    if (!isOwnPost || isDeleting) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
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

      // Show delete toast
      showToast("Post deleted");

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

  // Create carousel items from media
  const carouselItems = post.post_media?.map((media, index) => (
    <div key={media.id} className="w-full aspect-square">
      {media.media_type === 'image' ? (
        <img
          src={media.media_url}
          alt="Post content"
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      ) : (
        <VideoPreview
          src={media.media_url}
          className="w-full h-full"
          videoId={`user-post-${post.id}-${index}`}
        />
      )}
    </div>
  )) || [];

  const PostContent = () => (
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
          
          {isOwnPost ? (
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
          ) : (
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Post Content with Tagged Text */}
        {post.content && (
          <div className="text-sm mb-3">
            <TaggedText text={post.content} tags={post.post_tags} />
          </div>
        )}

        {/* Post Media using SwipeCarousel */}
        {carouselItems.length > 0 && (
          <div className="mb-3">
            <div className="rounded-lg overflow-hidden">
              <SwipeCarousel
                items={carouselItems}
                showDots={carouselItems.length > 1}
                showArrows={false}
              />
            </div>
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

  return (
    <>
      {isOwnPost ? (
        <ContextMenu>
          <ContextMenuTrigger>
            <PostContent />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Post
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Post'}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        <PostContent />
      )}

      <EditPostDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        post={post}
        onPostUpdated={onPostUpdated}
      />
    </>
  );
};

export default UserPost;
