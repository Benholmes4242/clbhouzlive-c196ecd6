
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video } from 'lucide-react';

interface MediaActionButtonsProps {
  selectedImages: File[];
  onPhotoUpload: () => void;
  onVideoUpload: () => void;
  onClearSelection: () => void;
}

const MediaActionButtons = ({ 
  selectedImages, 
  onPhotoUpload, 
  onVideoUpload, 
  onClearSelection 
}: MediaActionButtonsProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <span className="font-medium">Media Library</span>
        {selectedImages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-red-600 hover:text-red-700"
          >
            Clear
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onPhotoUpload}
        >
          <Image className="h-4 w-4" />
          Photos
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onVideoUpload}
        >
          <Video className="h-4 w-4" />
          Videos
        </Button>
      </div>
    </div>
  );
};

export default MediaActionButtons;
