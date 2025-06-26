
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
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
  variant?: 'header' | 'full';
}

const CreatePostDialog = ({ onPostCreated, variant = 'header' }: CreatePostDialogProps) => {
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

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === 'header' ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground hover:text-primary-foreground"
          >
            <Plus className="h-5 w-5" />
          </Button>
        ) : (
          <Button size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Share</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create Post</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
