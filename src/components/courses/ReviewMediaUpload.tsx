
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video, X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewMediaUploadProps {
  onMediaSelected: (files: File[]) => void;
  selectedMedia: File[];
  onRemoveMedia: (index: number) => void;
  showAddMoreButton?: boolean;
}

const ReviewMediaUpload = ({ onMediaSelected, selectedMedia, onRemoveMedia, showAddMoreButton = false }: ReviewMediaUploadProps) => {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFiles = (files: File[]) => {
    // Check total file count (max 5)
    if (selectedMedia.length + files.length > 5) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 5 media files per review.",
        variant: "destructive",
      });
      return false;
    }
    
    // No file size limits - users can upload files of any size

    // Check file types
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'video/mp4', 'video/quicktime', 'video/mov'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, MP4, and MOV files are supported.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (validateFiles(files)) {
      onMediaSelected(files);
    }
  }, [selectedMedia, onMediaSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelection = (accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        if (validateFiles(files)) {
          onMediaSelected(files);
        }
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

  if (showAddMoreButton) {
    return (
      <button
        type="button"
        onClick={() => handleFileSelection('image/jpeg,image/png,image/heic,image/webp,video/mp4,video/quicktime,video/mov')}
        className="mt-2 text-xs font-medium text-slate-500 underline underline-offset-2"
      >
        Add more photos or videos
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drag and Drop Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => handleFileSelection('image/jpeg,image/png,image/heic,image/webp,video/mp4,video/quicktime,video/mov')}
        style={{ cursor: 'pointer' }}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Click or drag to upload photos or videos
        </p>
        <p className="text-xs text-gray-500">
          JPG, PNG, MP4, MOV • Max 5 items • No size limits
        </p>
      </div>

      {/* Alternative Upload Buttons */}
      <div className="flex gap-2 justify-center">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelection('image/jpeg,image/png,image/heic,image/webp');
          }}
          disabled={selectedMedia.length >= 5}
        >
          <Image className="h-4 w-4" />
          Photos
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelection('video/mp4,video/quicktime,video/mov');
          }}
          disabled={selectedMedia.length >= 5}
        >
          <Video className="h-4 w-4" />
          Videos
        </Button>
      </div>
    </div>
  );
};

export default ReviewMediaUpload;
