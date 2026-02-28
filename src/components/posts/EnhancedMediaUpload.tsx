import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RotateCw, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MediaDropzone from './MediaDropzone';
import EnhancedMediaPreviewGrid from './EnhancedMediaPreviewGrid';
import { toast } from 'sonner';
import { useChunkedUpload } from '@/hooks/useChunkedUpload';

interface MediaFile {
  file: File;
  url: string;
  id: string;
  rotation?: number;
  isLargeFile?: boolean; // Flag for files that should use chunked upload
  uploadProgress?: number;
  isUploading?: boolean;
  uploadUrl?: string; // Final uploaded URL
  error?: string;
}

interface ExistingMedia {
  url: string;
  id: string;
  type: 'image' | 'video';
  rotation?: number; // Add rotation support for existing media
}

interface EnhancedMediaUploadProps {
  onFilesChange: (files: File[]) => void;
  onFilesUploaded?: (uploadedFiles: { file: File; url: string }[]) => void; // New callback for uploaded files
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  initialFiles?: File[];
  existingMediaUrls?: string[];
  onExistingMediaRemove?: (url: string) => void;
  className?: string;
  autoUpload?: boolean; // Whether to automatically upload files
}

const EnhancedMediaUpload: React.FC<EnhancedMediaUploadProps> = ({
  onFilesChange,
  onFilesUploaded,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  disabled = false,
  initialFiles = [],
  existingMediaUrls = [],
  onExistingMediaRemove,
  className,
  autoUpload = false
}) => {
  const { uploadFileInChunks } = useChunkedUpload();
  
  // Define large file threshold (50MB)
  const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(() => {
    return existingMediaUrls.map(url => ({
      url,
      id: uuidv4(),
      type: url.includes('video') || url.includes('.mp4') || url.includes('.mov') ? 'video' : 'image'
    }));
  });

  const totalMediaCount = mediaFiles.length + existingMedia.length;

  // Validate file type only - no size restrictions
  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];

    files.forEach(file => {
      // No file size limits - users can upload files of any size

      // Check if we've reached max files
      if (totalMediaCount + validFiles.length >= maxFiles) {
        toast.error("Too many files", {
          description: `Maximum ${maxFiles} files allowed`,
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
        toast.error("Invalid file type", {
          description: `${file.name} is not a supported file type`,
        });
        return;
      }

      validFiles.push(file);
    });

    return validFiles;
  };

  // Upload function for chunked uploads
  const uploadFile = useCallback(async (mediaFile: MediaFile) => {
    try {
      setMediaFiles(prev => prev.map(f => 
        f.id === mediaFile.id ? { ...f, isUploading: true, error: undefined } : f
      ));

      let uploadUrl: string;

      // Use chunked upload for large files
      if (mediaFile.isLargeFile) {
        console.log(`Using chunked upload for large file: ${mediaFile.file.name} (${mediaFile.file.size} bytes)`);
        
        const result = await uploadFileInChunks(mediaFile.file, (progress) => {
          // Update progress during chunked upload
          setMediaFiles(prev => prev.map(f => 
            f.id === mediaFile.id ? { ...f, uploadProgress: progress.percentage } : f
          ));
        });
        
        uploadUrl = result.publicUrl;
      } else {
        // Use standard upload for smaller files - you can integrate with your existing upload logic here
        // For now, we'll simulate an upload
        console.log(`Using standard upload for file: ${mediaFile.file.name}`);
        
        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setMediaFiles(prev => prev.map(f => 
            f.id === mediaFile.id ? { ...f, uploadProgress: progress } : f
          ));
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // This would be replaced with your actual upload logic
        uploadUrl = URL.createObjectURL(mediaFile.file);
      }

      setMediaFiles(prev => prev.map(f => 
        f.id === mediaFile.id ? { 
          ...f, 
          uploadUrl,
          isUploading: false, 
          uploadProgress: 100
        } : f
      ));

      // Notify parent of uploaded file
      if (onFilesUploaded) {
        onFilesUploaded([{ file: mediaFile.file, url: uploadUrl }]);
      }

      toast.success("Upload complete", {
        description: `${mediaFile.file.name} uploaded successfully`,
        duration: 2000,
      });


    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setMediaFiles(prev => prev.map(f => 
        f.id === mediaFile.id ? { 
          ...f, 
          isUploading: false, 
          error: errorMessage,
          uploadProgress: 0 
        } : f
      ));
      
      toast.error("Upload failed", {
        description: errorMessage,
      });
    }
  }, [uploadFileInChunks, onFilesUploaded]);

  const handleFilesSelected = useCallback((files: File[]) => {
    console.log('EnhancedMediaUpload: Files selected:', files.map(f => f.name));
    
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    const newMediaFiles = validFiles.map(file => {
      const isLargeFile = file.size > LARGE_FILE_THRESHOLD;
      return {
        file,
        url: URL.createObjectURL(file),
        id: uuidv4(),
        isLargeFile,
        uploadProgress: 0,
        isUploading: false
      };
    });

    setMediaFiles(prev => {
      const updated = [...prev, ...newMediaFiles];
      console.log('EnhancedMediaUpload: Updated media files count:', updated.length);
      
      // Notify parent of changes
      const allFiles = updated.map(m => m.file);
      onFilesChange(allFiles);
      
      // Auto-upload if enabled
      if (autoUpload) {
        newMediaFiles.forEach(mediaFile => {
          uploadFile(mediaFile);
        });
      }
      
      return updated;
    });

    if (validFiles.length > 0) {
      toast.success("Files added", {
        description: `${validFiles.length} file(s) added successfully`,
      });
    }
  }, [totalMediaCount, maxFiles, acceptedTypes, onFilesChange, autoUpload, uploadFile]);

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

  const handleReorderFiles = useCallback((reorderedFiles: MediaFile[]) => {
    setMediaFiles(reorderedFiles);
    
    // Notify parent of changes
    const allFiles = reorderedFiles.map(m => m.file);
    onFilesChange(allFiles);
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

    toast.success("Image edited", {
      description: "Your changes have been applied",
    });
  }, [onFilesChange]);

  const handleRotateFile = useCallback((fileId: string, rotation: number) => {
    setMediaFiles(prev => {
      const updated = prev.map(media => {
        if (media.id === fileId) {
          return {
            ...media,
            rotation
          };
        }
        return media;
      });
      
      return updated;
    });

    toast.success("Media rotated", {
      description: `Rotated ${rotation}°`,
    });
  }, []);

  const handleRotateExistingMedia = useCallback((mediaId: string) => {
    setExistingMedia(prev => {
      return prev.map(media => {
        if (media.id === mediaId) {
          const currentRotation = media.rotation || 0;
          const newRotation = (currentRotation + 90) % 360;
          return {
            ...media,
            rotation: newRotation
          };
        }
        return media;
      });
    });

    toast.success("Media rotated", {
      description: "Existing media rotated 90°",
    });
  }, []);

  // Initialize mediaFiles when initialFiles changes
  React.useEffect(() => {
    console.log('EnhancedMediaUpload: initialFiles changed:', initialFiles.length, initialFiles.map(f => f.name));
    
    if (initialFiles.length > 0) {
      const newMediaFiles = initialFiles.map(file => {
        const isLargeFile = file.size > LARGE_FILE_THRESHOLD;
        console.log('EnhancedMediaUpload: Creating media file for:', file.name, 'size:', file.size);
        return {
          file,
          url: URL.createObjectURL(file),
          id: uuidv4(),
          isLargeFile,
          uploadProgress: 0,
          isUploading: false
        };
      });
      
      console.log('EnhancedMediaUpload: Setting mediaFiles to:', newMediaFiles.length, 'items');
      setMediaFiles(newMediaFiles);
      
      // Notify parent of changes
      onFilesChange(initialFiles);
      
      // Auto-upload if enabled
      if (autoUpload) {
        console.log('EnhancedMediaUpload: Auto-uploading files...');
        newMediaFiles.forEach(mediaFile => {
          uploadFile(mediaFile);
        });
      }
    } else {
      console.log('EnhancedMediaUpload: No initial files, clearing mediaFiles');
      setMediaFiles([]);
    }
  }, [initialFiles, autoUpload, uploadFile, onFilesChange]);

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
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{ transform: `rotate(${media.rotation || 0}deg)` }}
                      muted
                    />
                  ) : (
                    <img 
                      src={media.url} 
                      alt="Existing media"
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{ transform: `rotate(${media.rotation || 0}deg)` }}
                    />
                  )}

                  {/* Overlay Controls for Existing Media */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRotateExistingMedia(media.id)}
                      className="h-8 w-8 p-0"
                      title="Rotate media"
                      disabled={disabled}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
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
      <EnhancedMediaPreviewGrid
        mediaFiles={mediaFiles}
        onRemoveFile={handleRemoveFile}
        onEditFile={handleEditFile}
        onRotateFile={handleRotateFile}
        onUploadFile={uploadFile}
        onReorderFiles={handleReorderFiles}
        maxFiles={maxFiles}
        showUploadControls={!autoUpload}
      />
    </div>
  );
};

export default EnhancedMediaUpload;