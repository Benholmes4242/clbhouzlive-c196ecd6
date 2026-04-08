
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

interface CreatePostDialogProps {
  onPostCreated?: () => void;
  variant?: 'header' | 'full' | 'floating' | 'bottom-nav';
}

const CreatePostDialog = ({ onPostCreated, variant = 'header' }: CreatePostDialogProps) => {
  const openPostStudio = usePostStudioStore((s) => s.openPostStudio);

  const handleClick = () => {
    openPostStudio({ returnPath: window.location.pathname });
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleClick}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>
    );
  }

  return (
    <Button onClick={handleClick} variant="outline" size="sm" className="gap-1.5">
      <Plus className="h-4 w-4" />
      Post
    </Button>
  );
};

export default CreatePostDialog;
