
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video } from 'lucide-react';

interface MediaFileHandlerProps {
  onFilesSelected: (files: File[]) => void;
}

const MediaFileHandler = ({ onFilesSelected }: MediaFileHandlerProps) => {
  const handleFileSelection = (accept: string, multiple: boolean = true) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        onFilesSelected(files);
      }
    };
    input.click();
  };

  const handlePhotoClick = () => {
    handleFileSelection('image/*');
  };

  const handleVideoClick = () => {
    handleFileSelection('video/*');
  };

  return (
    <div className="flex gap-2">
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
  );
};

export default MediaFileHandler;
