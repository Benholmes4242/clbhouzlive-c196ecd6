
import React from 'react';
import { Camera } from 'lucide-react';
import CreatePostDialog from '@/components/posts/CreatePostDialog';

const FloatingPostButton = () => {
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <CreatePostDialog 
        variant="floating"
        onPostCreated={() => {
          // Optionally refresh the explore feed
        }}
      />
    </div>
  );
};

export default FloatingPostButton;
