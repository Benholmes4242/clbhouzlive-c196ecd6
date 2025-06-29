
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewMediaUploadProps {
  onMediaSelected: (files: File[]) => void;
  selectedMedia: File[];
  onRemoveMedia: (index: number) => void;
}

const ReviewMediaUpload = ({ onMediaSelected, selectedMedia, onRemoveMedia }: ReviewMediaUploadProps) => {
  const { toast } = useToast();

  const handleFileSelection = (accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        
        // Check total file count (max 5)
        if (selectedMedia.length + files.length > 5) {
          toast({
            title: "Too many files",
            description: "You can upload a maximum of 5 media files per review.",
            variant: "destructive",
          });
          return;
        }
        
        // Check file sizes (max 50MB each)
        const oversizedFiles = files.filter(file => file.size > 52428800);
        if (oversizedFiles.length > 0) {
          toast({
            title: "File too large",
            description: "Each file must be smaller than 50MB.",
            variant: "destructive",
          });
          return;
        }
        
        onMediaSelected(files);
      }
    };
    input.click();
  };

  const getMediaPreview = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);
    
    return (
      <div key={file.name} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
        {isVideo ? (
          <video src={url} className="w-full h-full object-cover" />
        ) : (
          <img src={url} alt={file.name} className="w-full h-full object-cover" />
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
            </div>
          </div>
        )}
        <button
          onClick={() => onRemoveMedia(selectedMedia.indexOf(file))}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => handleFileSelection('image/jpeg,image/png,image/heic,image/webp')}
          disabled={selectedMedia.length >= 5}
        >
          <Image className="h-4 w-4" />
          Add Photos
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => handleFileSelection('video/mp4,video/quicktime,video/mov')}
          disabled={selectedMedia.length >= 5}
        >
          <Video className="h-4 w-4" />
          Add Videos
        </Button>
      </div>
      
      {selectedMedia.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Selected media ({selectedMedia.length}/5):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedMedia.map((file, index) => (
              <div key={index}>
                {getMediaPreview(file)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewMediaUpload;
