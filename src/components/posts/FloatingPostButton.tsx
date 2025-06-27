
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreatePostDialog from './CreatePostDialog';

const FloatingPostButton = () => {
  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center">
      <CreatePostDialog 
        variant="floating"
        onPostCreated={() => window.location.reload()} 
      />
      <span className="text-xs text-muted-foreground mt-1 font-medium">Post</span>
    </div>
  );
};

export default FloatingPostButton;
