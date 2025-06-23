
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from './PostSubmissionHandler';
import PostContentForm from './PostContentForm';
import PhotoGallery from './PhotoGallery';
import DialogNavigation from './DialogNavigation';

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
  const { submitPost } = usePostSubmission();
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
    
    await submitPost({
      user,
      content,
      mediaFiles,
      selectedTags,
      onSuccess: () => {
        resetForm();
        onPostCreated?.();
      },
      onError: () => {
        // Error handling is done in the submission handler
      }
    });

    setIsSubmitting(false);
  };

  const handleOpenDialog = () => {
    setOpen(true);
    setShowGallery(true);
  };

  const canProceedFromGallery = mediaFiles.length > 0;
  const canSubmit = !isSubmitting && (content.trim() || mediaFiles.length > 0);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isSubmitting) {
        resetForm();
      } else if (isOpen) {
        setOpen(true);
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
            <DialogNavigation
              showGallery={Boolean(showGallery)}
              isSubmitting={isSubmitting}
              canProceedFromGallery={canProceedFromGallery}
              canSubmit={canSubmit}
              onClose={() => !isSubmitting && setOpen(false)}
              onBackToGallery={() => setShowGallery(true)}
              onNext={() => setShowGallery(false)}
              onSubmit={handleSubmit}
            />
            <div className="flex-1 overflow-hidden">
              <PhotoGallery 
                onFilesSelected={handleFilesSelected}
                selectedFiles={mediaFiles}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <DialogNavigation
              showGallery={Boolean(showGallery)}
              isSubmitting={isSubmitting}
              canProceedFromGallery={canProceedFromGallery}
              canSubmit={canSubmit}
              onClose={() => !isSubmitting && setOpen(false)}
              onBackToGallery={() => setShowGallery(true)}
              onNext={() => setShowGallery(false)}
              onSubmit={handleSubmit}
            />
            
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
