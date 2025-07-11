import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MediaDropzone from './MediaDropzone';
import MediaPreviewGrid from './MediaPreviewGrid';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  file: File;
  url: string;
  id: string;
}

interface ExistingMedia {
  url: string;
  id: string;
  type: 'image' | 'video';
}

interface EnhancedMediaUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  initialFiles?: File[];
  existingMediaUrls?: string[];
  onExistingMediaRemove?: (url: string) => void;
  className?: string;
}

const EnhancedMediaUpload: React.FC<EnhancedMediaUploadProps> = ({
  onFilesChange,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  disabled = false,
  initialFiles = [],
  existingMediaUrls = [],
  onExistingMediaRemove,
  className
}) => {
  const { toast } = useToast();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    return initialFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: uuidv4()
    }));
  });

  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(() => {
    return existingMediaUrls.map(url => ({
      url,
      id: uuidv4(),
      type: url.includes('video') || url.includes('.mp4') || url.includes('.mov') ? 'video' : 'image'
    }));
  });

  const totalMediaCount = mediaFiles.length + existingMedia.length;

  // Validate file size and type
  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const maxSizeInMB = 100; // 100MB max per file
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    files.forEach(file => {
      // Check file size
      if (file.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than ${maxSizeInMB}MB`,
          variant: "destructive",
        });
        return;
      }

      // Check if we've reached max files
      if (totalMediaCount + validFiles.length >= maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
    });

    return validFiles;
  };

  const handleFilesSelected = useCallback((files: File[]) => {
    console.log('EnhancedMediaUpload: Files selected:', files.map(f => f.name));
    
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    const newMediaFiles = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: uuidv4()
    }));

    setMediaFiles(prev => {
      const updated = [...prev, ...newMediaFiles];
      console.log('EnhancedMediaUpload: Updated media files count:', updated.length);
      
      // Notify parent of changes
      const allFiles = updated.map(m => m.file);
      onFilesChange(allFiles);
      
      return updated;
    });

    if (validFiles.length > 0) {
      toast({
        title: "Files added",
        description: `${validFiles.length} file(s) added successfully`,
      });
    }
  }, [totalMediaCount, maxFiles, acceptedTypes, onFilesChange, toast]);

  const handleRemoveExistingMedia = useCallback((mediaId: string) => {
    setExistingMedia(prev => {
      const mediaToRemove = prev.find(m => m.id === mediaId);
      const updated = prev.filter(m => m.id !== mediaId);
      
      if (mediaToRemove && onExistingMediaRemove) {
        onExistingMediaRemove(mediaToRemove.url);
      }
      
      return updated;
    });
  }, [onExistingMediaRemove]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      
      const updated = prev.filter(f => f.id !== fileId);
      
      // Notify parent of changes
      const allFiles = updated.map(m => m.file);
      onFilesChange(allFiles);
      
      return updated;
    });
  }, [onFilesChange]);

  const handleEditFile = useCallback((fileId: string, editedFile: File) => {
    setMediaFiles(prev => {
      const updated = prev.map(media => {
        if (media.id === fileId) {
          // Clean up old URL
          URL.revokeObjectURL(media.url);
          
          return {
            ...media,
            file: editedFile,
            url: URL.createObjectURL(editedFile)
          };
        }
        return media;
      });
      
      // Notify parent of changes
      const allFiles = updated.map(m => m.file);
      onFilesChange(allFiles);
      
      return updated;
    });

    toast({
      title: "Image edited",
      description: "Your changes have been applied",
    });
  }, [onFilesChange, toast]);

  // Cleanup URLs when component unmounts
  React.useEffect(() => {
    return () => {
      mediaFiles.forEach(media => {
        URL.revokeObjectURL(media.url);
      });
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Show dropzone only if we haven't reached max files */}
      {totalMediaCount < maxFiles && (
        <MediaDropzone
          onFilesSelected={handleFilesSelected}
          maxFiles={maxFiles - totalMediaCount}
          acceptedTypes={acceptedTypes}
          disabled={disabled}
        />
      )}

      {/* Show existing media */}
      {existingMedia.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Media:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingMedia.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {media.type === 'video' ? (
                    <video 
                      src={media.url} 
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img 
                      src={media.url} 
                      alt="Existing media"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <button
                  onClick={() => handleRemoveExistingMedia(media.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show preview grid for new files */}
      <MediaPreviewGrid
        mediaFiles={mediaFiles}
        onRemoveFile={handleRemoveFile}
        onEditFile={handleEditFile}
        maxFiles={maxFiles}
      />
    </div>
  );
};

export default EnhancedMediaUpload;