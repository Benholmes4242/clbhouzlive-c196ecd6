import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Image, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string | null;
    post_media: PostMedia[];
  };
  onPostUpdated?: () => void;
}

const EditPostDialog = ({ open, onOpenChange, post, onPostUpdated }: EditPostDialogProps) => {
  const { user } = useSupabaseSession();
  const [content, setContent] = useState(post.content || '');
  const [existingMedia, setExistingMedia] = useState<PostMedia[]>(post.post_media || []);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        setNewMediaFiles(prev => [...prev, ...files]);
      }
    };
    input.click();
  };

  const handleVideoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        setNewMediaFiles(prev => [...prev, ...files]);
      }
    };
    input.click();
  };

  const removeNewFile = (index: number) => {
    setNewMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('post_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
      toast.success("Media removed", {
        description: "The media has been removed from your post."
      });
    } catch (error) {
      console.error('Error removing media:', error);
      toast.error("Error", {
        description: "Failed to remove media. Please try again.",
      });
    }
  };

  const uploadNewMedia = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
    const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-post-images', fileName);

    if (!uploadResult.success || !uploadResult.publicUrl) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    const publicUrl = uploadResult.publicUrl;

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    
    const { error: mediaError } = await supabase
      .from('post_media')
      .insert({
        post_id: post.id,
        media_type: mediaType,
        media_url: publicUrl
      });

    if (mediaError) throw mediaError;
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error: postError } = await supabase
        .from('posts')
        .update({
          content: content.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (postError) throw postError;

      for (const file of newMediaFiles) {
        await uploadNewMedia(file);
      }

      toast.success("Post updated!", {
        description: "Your post has been updated successfully."
      });

      onOpenChange(false);
      onPostUpdated?.();

    } catch (error) {
      console.error('Error updating post:', error);
      toast.error("Error", {
        description: "Failed to update post. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {existingMedia.length > 0 && (
            <div className="space-y-2">
              <Label>Current Media:</Label>
              <div className="space-y-2">
                {existingMedia.map((media) => (
                  <div key={media.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">
                      {media.media_type === 'image' ? '📷' : '🎥'} {media.media_type}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExistingMedia(media.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Add More Photos or Videos</Label>
            <div className="flex gap-2 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handlePhotoClick}
              >
                <Image className="h-4 w-4" />
                Photo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleVideoClick}
              >
                <Video className="h-4 w-4" />
                Video
              </Button>
            </div>
          </div>

          {newMediaFiles.length > 0 && (
            <div className="space-y-2">
              <Label>New Files to Add:</Label>
              <div className="space-y-2">
                {newMediaFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostDialog;
