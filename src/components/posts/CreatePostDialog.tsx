
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';
import PostContentForm from './PostContentForm';
import PhotoGallery from './PhotoGallery';

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
  const [showGallery, setShowGallery] = useState(false);

  const handleFilesSelected = (newFiles: File[]) => {
    setMediaFiles(prev => [...prev, ...newFiles]);
    setShowGallery(false);
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
      setShowGallery(false);
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

  const handleOpenDialog = () => {
    setOpen(true);
    setShowGallery(true);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setShowGallery(false);
        setContent('');
        setMediaFiles([]);
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg md:relative md:bottom-0 md:right-0 md:h-10 md:w-auto md:rounded-md md:px-4"
          onClick={handleOpenDialog}
        >
          <Plus className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Create Post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-full sm:max-h-full sm:h-full sm:w-full p-0 gap-0">
        {showGallery ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-lg font-semibold">New post</DialogTitle>
              <Button 
                variant="ghost" 
                onClick={() => setShowGallery(false)}
                disabled={mediaFiles.length === 0}
                className="text-blue-500 font-semibold disabled:text-gray-400"
              >
                Next
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PhotoGallery 
                onFilesSelected={handleFilesSelected}
                selectedFiles={mediaFiles}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <Button variant="ghost" size="icon" onClick={() => setShowGallery(true)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-lg font-semibold">New post</DialogTitle>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
                className="text-blue-500 font-semibold disabled:text-gray-400"
                variant="ghost"
              >
                {isSubmitting ? 'Sharing...' : 'Share'}
              </Button>
            </div>
            
            <div className="flex-1 p-4">
              <PostContentForm
                content={content}
                onContentChange={setContent}
                mediaFiles={mediaFiles}
                onFilesSelected={handleFilesSelected}
                onRemoveFile={removeFile}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
