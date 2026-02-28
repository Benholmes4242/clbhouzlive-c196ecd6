
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2, Upload, ImageIcon, Camera, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getMediaType } from '@/utils/getMediaType';

interface ReviewMediaUploadProps {
  onMediaSelected: (files: File[]) => void;
  selectedMedia: File[];
  onRemoveMedia: (index: number) => void;
  showAddMoreButton?: boolean;
}

const ReviewMediaUpload = ({ onMediaSelected, selectedMedia, onRemoveMedia, showAddMoreButton = false }: ReviewMediaUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const validateFiles = (files: File[]) => {
    // Check total file count (max 5)
    if (selectedMedia.length + files.length > 5) {
      toast.error("Too many files", { description: "You can upload a maximum of 5 media files per review." });
      return false;
    }
    
    // No file size limits - users can upload files of any size

    // Check file types - use extension fallback for iOS empty MIME
    const invalidFiles = files.filter(file => getMediaType(file) === 'unknown');
    if (invalidFiles.length > 0) {
      console.warn('[ReviewMediaUpload] Invalid files rejected:', invalidFiles.map(f => ({ name: f.name, type: f.type })));
      toast.error("Invalid file type", { description: "Photos (JPG/PNG/HEIC) and videos (MP4/MOV) are supported." });
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

  const handleFileSelection = (accept: string, capture?: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;

    // iOS reliability: ensure input is in the DOM when clicked
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';

    if (capture) {
      input.setAttribute('capture', 'environment');
    }

    const cleanup = () => {
      try {
        input.value = '';
      } catch {
        // no-op
      }
      input.remove();
    };

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      console.log('[ReviewMediaUpload] input.onchange fired:', {
        count: files.length,
        files: files.map((f) => ({ name: f.name, size: f.size, type: f.type, inferred: getMediaType(f) })),
      });

      if (files.length > 0 && validateFiles(files)) {
        onMediaSelected(files);
      }
      cleanup();
    };

    document.body.appendChild(input);
    input.click();
    setShowPicker(false);
  };

  const handleOpenLibrary = () => {
    handleFileSelection('image/*,video/*');
  };

  const handleOpenCamera = () => {
    handleFileSelection('image/*,video/*', true);
  };

  const handleOpenFiles = () => {
    handleFileSelection('image/*,video/*');
  };

  const mediaOptions = [
    {
      key: "library",
      label: "Media Library",
      icon: ImageIcon,
      onClick: handleOpenLibrary,
    },
    {
      key: "camera",
      label: "Take Photo or Video",
      icon: Camera,
      onClick: handleOpenCamera,
    },
    {
      key: "files",
      label: "Choose Files",
      icon: FolderOpen,
      onClick: handleOpenFiles,
    },
  ];

  const getMediaPreview = (file: File) => {
    const isVideo = getMediaType(file) === 'video';
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
          className="absolute bottom-1 right-1 min-w-[44px] min-h-[44px] w-7 h-7 bg-red-500/90 text-white rounded-md flex items-center justify-center backdrop-blur-sm hover:bg-red-600 transition-colors"
          aria-label="Remove media"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (showAddMoreButton) {
    return (
      <button
        type="button"
        onClick={() => handleFileSelection('image/*,video/*')}
        className="mt-2 text-xs font-medium text-slate-500 underline underline-offset-2"
      >
        Add more photos or videos
      </button>
    );
  }

  return (
    <>
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
          onClick={() => setShowPicker(true)}
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

        {/* Unified Media Upload Button */}
        <div className="flex justify-center">
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowPicker(true);
            }}
            disabled={selectedMedia.length >= 5}
          >
            <ImagePlus className="w-4 h-4" />
            Add Media
          </Button>
        </div>
      </div>

      {/* Media Picker Modal */}
      <Sheet open={showPicker} onOpenChange={setShowPicker}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Add Media</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-6 pb-6">
            {mediaOptions.map(({ key, label, icon: Icon, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="flex w-full items-center gap-3 rounded-sq-md bg-background/90 px-4 py-3 shadow-sm active:scale-[0.99] transition-transform"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5">
                  <Icon className="w-5 h-5 text-foreground/80" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ReviewMediaUpload;
