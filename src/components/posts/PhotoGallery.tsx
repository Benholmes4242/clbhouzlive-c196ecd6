
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video, Camera, FolderOpen } from 'lucide-react';

interface PhotoGalleryProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
}

const PhotoGallery = ({ onFilesSelected, selectedFiles }: PhotoGalleryProps) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (acceptType: string = 'image/*,video/*') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptType;
    input.multiple = true;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        
        // Create preview URLs
        const urls = fileArray.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
        setSelectedImages(fileArray);
        
        // If single file selected, immediately use it
        if (fileArray.length === 1) {
          onFilesSelected(fileArray);
        }
      }
    };
    
    input.click();
  };

  const handlePhotoUpload = () => {
    handleFileUpload('image/*');
  };

  const handleVideoUpload = () => {
    handleFileUpload('video/*');
  };

  const handleImageClick = (index: number) => {
    if (isMultiSelect) {
      // Handle multi-select logic if needed
    } else {
      // Single select - use the clicked file
      onFilesSelected([selectedImages[index]]);
    }
  };

  const handleSelectImages = () => {
    if (selectedImages.length > 0) {
      onFilesSelected(selectedImages);
    }
  };

  const clearSelection = () => {
    // Clean up preview URLs to prevent memory leaks
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setSelectedImages([]);
  };

  // Clean up URLs when component unmounts
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Selected image preview */}
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
                onClick={() => handleFileUpload()}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                Browse Files
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="flex-1 bg-white">
        {/* Action buttons */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Media Library</span>
            {selectedImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
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
              onClick={handlePhotoUpload}
            >
              <Image className="h-4 w-4" />
              Photos
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleVideoUpload}
            >
              <Video className="h-4 w-4" />
              Videos
            </Button>
          </div>
        </div>

        {/* File grid or empty state */}
        {previewUrls.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 p-1">
            {previewUrls.map((url, index) => (
              <div 
                key={index}
                className="aspect-square relative cursor-pointer"
                onClick={() => handleImageClick(index)}
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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No media selected
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              Choose photos or videos from your device to get started
            </p>
            <div className="flex gap-3">
              <Button onClick={handlePhotoUpload} className="gap-2">
                <Image className="h-4 w-4" />
                Select Photos
              </Button>
              <Button onClick={handleVideoUpload} variant="outline" className="gap-2">
                <Video className="h-4 w-4" />
                Select Videos
              </Button>
            </div>
          </div>
        )}

        {/* Select button for multiple files */}
        {selectedImages.length > 1 && (
          <div className="p-4 border-t">
            <Button 
              onClick={handleSelectImages}
              className="w-full"
            >
              Use {selectedImages.length} file{selectedImages.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={() => {}} // Handled by dynamic inputs above
        className="hidden"
      />
    </div>
  );
};

export default PhotoGallery;
