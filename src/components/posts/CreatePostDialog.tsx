
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';
import PostContentForm from './PostContentForm';

interface CreatePostDialogProps {
  onPostCreated?: () => void;
}

const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFilesSelected = (newFiles: File[]) => {
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (file: File, postId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    
    const { error: mediaError } = await supabase
      .from('post_media')
      .insert({
        post_id: postId,
        media_type: mediaType,
        media_url: publicUrl
      });

    if (mediaError) throw mediaError;
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && mediaFiles.length === 0)) return;

    setIsSubmitting(true);
    try {
      // Create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim() || null
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload media files
      for (const file of mediaFiles) {
        await uploadMedia(file, postData.id);
      }

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully."
      });

      // Reset form
      setContent('');
      setMediaFiles([]);
      setOpen(false);
      onPostCreated?.();

    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg md:relative md:bottom-0 md:right-0 md:h-10 md:w-auto md:rounded-md md:px-4">
          <Plus className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Create Post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>
        
        <PostContentForm
          content={content}
          onContentChange={setContent}
          mediaFiles={mediaFiles}
          onFilesSelected={handleFilesSelected}
          onRemoveFile={removeFile}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
