
import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';

interface MediaPreviewSectionProps {
  previewUrls: string[];
  selectedImages: File[];
  onFileUpload: () => void;
  onImageClick: (index: number) => void;
}

const MediaPreviewSection = ({ 
  previewUrls, 
  selectedImages, 
  onFileUpload, 
  onImageClick 
}: MediaPreviewSectionProps) => {
  return (
    <div className="h-80 flex-shrink-0 relative">
      {previewUrls.length > 0 ? (
        <div className="w-full h-full relative">
          {selectedImages[0]?.type.startsWith('video/') ? (
            <video 
              src={previewUrls[0]} 
              className="w-full h-full object-cover"
              controls={false}
              muted
            />
          ) : (
            <img 
              src={previewUrls[0]} 
              alt="Selected" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm opacity-70 mb-4">Select photos or videos from your device</p>
            <Button
              onClick={onFileUpload}
              className="bg-white/20 text-white hover:bg-white/30"
            >
              Browse Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPreviewSection;
