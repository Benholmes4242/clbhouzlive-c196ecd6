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

interface EnhancedMediaUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  initialFiles?: File[];
  className?: string;
}

const EnhancedMediaUpload: React.FC<EnhancedMediaUploadProps> = ({
  onFilesChange,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  disabled = false,
  initialFiles = [],
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
      if (mediaFiles.length + validFiles.length >= maxFiles) {
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
  }, [mediaFiles.length, maxFiles, acceptedTypes, onFilesChange, toast]);

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
      {mediaFiles.length < maxFiles && (
        <MediaDropzone
          onFilesSelected={handleFilesSelected}
          maxFiles={maxFiles - mediaFiles.length}
          acceptedTypes={acceptedTypes}
          disabled={disabled}
        />
      )}

      {/* Show preview grid if we have files */}
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