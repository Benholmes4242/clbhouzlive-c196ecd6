import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  onFilesSelected,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  disabled = false,
  className
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    onFilesSelected(acceptedFiles);
    setIsDragActive(false);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    multiple: maxFiles > 1
  });

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = maxFiles > 1;
    input.onchange = (event) => {
      const files = Array.from((event.target as HTMLInputElement).files || []);
      onFilesSelected(files);
    };
    input.click();
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = maxFiles > 1;
    input.onchange = (event) => {
      const files = Array.from((event.target as HTMLInputElement).files || []);
      onFilesSelected(files);
    };
    input.click();
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer",
        isDragActive && !isDragReject
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-gray-300 hover:border-gray-400",
        isDragReject && "border-red-500 bg-red-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="text-center space-y-4">
        {isDragActive ? (
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-primary animate-bounce" />
            <p className="text-lg font-medium text-primary">
              {isDragReject ? "File type not supported" : "Drop files here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Drag & drop media files here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse (max {maxFiles} files)
              </p>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePhotoClick}
                className="flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Photos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVideoClick}
                className="flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                Videos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaDropzone;