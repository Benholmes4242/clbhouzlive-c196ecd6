
import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen, Image, Video } from 'lucide-react';

interface MediaGridProps {
  previewUrls: string[];
  selectedImages: File[];
  onImageClick: (index: number) => void;
  onPhotoUpload: () => void;
  onVideoUpload: () => void;
  onSelectImages: () => void;
}

const MediaGrid = ({ 
  previewUrls, 
  selectedImages, 
  onImageClick, 
  onPhotoUpload, 
  onVideoUpload, 
  onSelectImages 
}: MediaGridProps) => {
  if (previewUrls.length > 0) {
    return (
      <>
        <div className="grid grid-cols-3 gap-1 p-1">
          {previewUrls.map((url, index) => (
            <div 
              key={`media-${index}-${url.slice(-20)}`}
              className="aspect-square relative cursor-pointer"
              onClick={() => onImageClick(index)}
            >
              {selectedImages[index]?.type.startsWith('video/') ? (
                <div className="relative w-full h-full">
                  <video 
                    src={url} 
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                </div>
              ) : (
                <img 
                  src={url} 
                  alt={`Selected ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              {index === 0 && (
                <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500" />
              )}
            </div>
          ))}
        </div>
        
        {/* Select button for multiple files */}
        {selectedImages.length > 1 && (
          <div className="p-4 border-t">
            <Button 
              onClick={onSelectImages}
              className="w-full"
            >
              Use {selectedImages.length} file{selectedImages.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No media selected
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm">
        Choose photos or videos from your device to get started
      </p>
      <div className="flex gap-3">
        <Button onClick={onPhotoUpload} className="gap-2">
          <Image className="h-4 w-4" />
          Select Photos
        </Button>
        <Button onClick={onVideoUpload} variant="outline" className="gap-2">
          <Video className="h-4 w-4" />
          Select Videos
        </Button>
      </div>
    </div>
  );
};

export default MediaGrid;
