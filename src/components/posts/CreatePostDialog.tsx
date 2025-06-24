import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from './PostSubmissionHandler';
import PostContentForm from './PostContentForm';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (content: string, mediaFiles: File[], selectedTags: TaggableEntity[]) => {
    if (!user) return;

    setIsSubmitting(true);
    
    await submitPost({
      user,
      content,
      mediaFiles,
      selectedTags,
      onSuccess: () => {
        setIsOpen(false);
        setIsSubmitting(false);
        onPostCreated?.();
      },
      onError: () => {
        setIsSubmitting(false);
        // Keep dialog open on error so user can retry
      }
    });
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <PostContentForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
