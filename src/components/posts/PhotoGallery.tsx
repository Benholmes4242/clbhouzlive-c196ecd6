
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video, Camera, Square, SquareStack } from 'lucide-react';

interface PhotoGalleryProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
}

const PhotoGallery = ({ onFilesSelected, selectedFiles }: PhotoGalleryProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock recent photos - in a real app, this would come from device storage
  const recentPhotos = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=300&fit=crop',
  ];

  const handleImageClick = (imageUrl: string) => {
    if (isMultiSelect) {
      setSelectedImages(prev => 
        prev.includes(imageUrl) 
          ? prev.filter(img => img !== imageUrl)
          : [...prev, imageUrl]
      );
    } else {
      setSelectedImages([imageUrl]);
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      onFilesSelected(fileArray);
    }
  };

  const convertUrlsToFiles = async (urls: string[]) => {
    const files: File[] = [];
    for (const url of urls) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
        files.push(file);
      } catch (error) {
        console.error('Error converting URL to file:', error);
      }
    }
    return files;
  };

  const handleSelectImages = async () => {
    if (selectedImages.length > 0) {
      const files = await convertUrlsToFiles(selectedImages);
      onFilesSelected(files);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Selected image preview */}
      <div className="h-80 flex-shrink-0 relative">
        {selectedImages.length > 0 ? (
          <img 
            src={selectedImages[0]} 
            alt="Selected" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-70">Select a photo</p>
            </div>
          </div>
        )}
        
        {/* Multi-select toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70"
          onClick={() => setIsMultiSelect(!isMultiSelect)}
        >
          {isMultiSelect ? <SquareStack className="h-5 w-5" /> : <Square className="h-5 w-5" />}
        </Button>
      </div>

      {/* Bottom section */}
      <div className="flex-1 bg-white">
        {/* Action buttons */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Recents</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleFileUpload}
            >
              <Image className="h-4 w-4" />
              Photo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleFileUpload}
            >
              <Video className="h-4 w-4" />
              Video
            </Button>
          </div>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-1 p-1">
          {recentPhotos.map((photo, index) => (
            <div 
              key={index}
              className="aspect-square relative cursor-pointer"
              onClick={() => handleImageClick(photo)}
            >
              <img 
                src={photo} 
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {isMultiSelect && selectedImages.includes(photo) && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {selectedImages.indexOf(photo) + 1}
                  </span>
                </div>
              )}
              {!isMultiSelect && selectedImages.includes(photo) && (
                <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500" />
              )}
            </div>
          ))}
        </div>

        {/* Select button for multiple images */}
        {isMultiSelect && selectedImages.length > 0 && (
          <div className="p-4 border-t">
            <Button 
              onClick={handleSelectImages}
              className="w-full"
            >
              Select {selectedImages.length} photo{selectedImages.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default PhotoGallery;
