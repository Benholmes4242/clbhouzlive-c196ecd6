
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';
import PostContentForm from './PostContentForm';
import PhotoGallery from './PhotoGallery';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface CreatePostDialogProps {
  onPostCreated?: () => void;
}

const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
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

  const createPostTags = async (postId: string) => {
    if (selectedTags.length === 0) return;

    const tagInserts = selectedTags.map(tag => ({
      post_id: postId,
      tagged_entity_id: tag.id,
      tagged_by_user_id: user!.id
    }));

    const { error } = await supabase
      .from('post_tags')
      .insert(tagInserts);

    if (error) throw error;
  };

  const resetForm = () => {
    setContent('');
    setMediaFiles([]);
    setSelectedTags([]);
    setOpen(false);
    setShowGallery(false);
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && mediaFiles.length === 0) || isSubmitting) return;

    setIsSubmitting(true);
    let postCreated = false;
    
    try {
      console.log('Starting post creation...');
      
      // Create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim() || null
        })
        .select()
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        throw postError;
      }

      console.log('Post created successfully:', postData.id);
      postCreated = true;

      // Upload media files
      if (mediaFiles.length > 0) {
        console.log('Uploading media files...');
        for (const file of mediaFiles) {
          await uploadMedia(file, postData.id);
        }
        console.log('Media upload completed');
      }

      // Create post tags
      if (selectedTags.length > 0) {
        console.log('Creating post tags...');
        await createPostTags(postData.id);
        console.log('Post tags created');
      }

      console.log('Post creation process completed successfully');

      toast({
        title: "Post created!",
        description: selectedTags.length > 0 
          ? `Your post has been shared and ${selectedTags.length} ${selectedTags.length === 1 ? 'person has' : 'people have'} been tagged.`
          : "Your post has been shared successfully."
      });

      // Reset form and notify parent
      resetForm();
      onPostCreated?.();

    } catch (error) {
      console.error('Error creating post:', error);
      
      // If the post was created but media/tags failed, still consider it a success
      // since the main content is saved
      if (postCreated) {
        console.log('Post was created but additional content failed. Treating as partial success.');
        toast({
          title: "Post created with issues",
          description: "Your post was created but some media or tags may not have been saved properly.",
          variant: "destructive"
        });
        resetForm();
        onPostCreated?.();
      } else {
        // Only show error if the actual post creation failed
        toast({
          title: "Failed to create post",
          description: "Please try again. If the problem persists, check your internet connection.",
          variant: "destructive"
        });
      }
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
      if (!newOpen && !isSubmitting) {
        resetForm();
      } else if (newOpen) {
        setOpen(newOpen);
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => !isSubmitting && setOpen(false)}
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-lg font-semibold">New post</DialogTitle>
              <Button 
                variant="ghost" 
                onClick={() => setShowGallery(false)}
                disabled={mediaFiles.length === 0 || isSubmitting}
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowGallery(true)}
                disabled={isSubmitting}
              >
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
                onTagsChange={setSelectedTags}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
