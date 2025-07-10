import React, { useState } from 'react';
import { X, Edit3, RotateCw, Trash2, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PhotoEditor from './PhotoEditor';

interface MediaFile {
  file: File;
  url: string;
  id: string;
}

interface MediaPreviewGridProps {
  mediaFiles: MediaFile[];
  onRemoveFile: (id: string) => void;
  onEditFile?: (id: string, editedFile: File) => void;
  maxFiles?: number;
  className?: string;
}

const MediaPreviewGrid: React.FC<MediaPreviewGridProps> = ({
  mediaFiles,
  onRemoveFile,
  onEditFile,
  maxFiles = 10,
  className
}) => {
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [imageRotations, setImageRotations] = useState<Record<string, number>>({});

  const handleEditClick = (fileId: string) => {
    setEditingFileId(fileId);
  };

  const handleEditSave = (editedFile: File) => {
    if (editingFileId && onEditFile) {
      onEditFile(editingFileId, editedFile);
    }
    setEditingFileId(null);
  };

  const handleImageLoad = (mediaId: string) => {
    setLoadingStates(prev => ({ ...prev, [mediaId]: false }));
  };

  const handleImageError = (mediaId: string) => {
    setImageErrors(prev => ({ ...prev, [mediaId]: true }));
    setLoadingStates(prev => ({ ...prev, [mediaId]: false }));
  };

  const handleImageLoadStart = (mediaId: string) => {
    setLoadingStates(prev => ({ ...prev, [mediaId]: true }));
    setImageErrors(prev => ({ ...prev, [mediaId]: false }));
  };

  const handleRotateImage = async (mediaId: string) => {
    const media = mediaFiles.find(m => m.id === mediaId);
    if (!media || !media.file.type.startsWith('image/')) return;

    const currentRotation = imageRotations[mediaId] || 0;
    const newRotation = (currentRotation + 90) % 360;
    
    setImageRotations(prev => ({ ...prev, [mediaId]: newRotation }));

    // Apply rotation to the actual file if onEditFile is provided
    if (onEditFile && newRotation !== 0) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Determine canvas dimensions based on rotation
          const isRotated90or270 = newRotation === 90 || newRotation === 270;
          canvas.width = isRotated90or270 ? img.height : img.width;
          canvas.height = isRotated90or270 ? img.width : img.height;
          
          // Clear canvas and apply rotation
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.save();
          
          // Move to center and rotate
          ctx?.translate(canvas.width / 2, canvas.height / 2);
          ctx?.rotate((newRotation * Math.PI) / 180);
          
          // Draw image from center
          ctx?.drawImage(img, -img.width / 2, -img.height / 2);
          ctx?.restore();
          
          // Convert canvas to blob and create new file
          canvas.toBlob((blob) => {
            if (blob) {
              const rotatedFile = new File([blob], media.file.name, {
                type: media.file.type,
                lastModified: Date.now(),
              });
              onEditFile(mediaId, rotatedFile);
            }
          }, media.file.type);
        };
        
        img.src = media.url;
      } catch (error) {
        console.error('Error rotating image:', error);
      }
    }
  };

  const editingFile = editingFileId 
    ? mediaFiles.find(f => f.id === editingFileId)?.file 
    : null;

  if (mediaFiles.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Selected Media ({mediaFiles.length}/{maxFiles})
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mediaFiles.map((media) => {
            const isImage = media.file.type.startsWith('image/');
            const isVideo = media.file.type.startsWith('video/');
            const hasError = imageErrors[media.id];

            return (
              <Card key={media.id} className="relative group overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  {/* Error State - Fallback Icon */}
                  {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        {isImage ? (
                          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                        ) : (
                          <VideoIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                        )}
                        <p className="text-xs text-gray-500">Preview unavailable</p>
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {isImage && !hasError && (
                    <img
                      src={media.url}
                      alt="Preview"
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{ 
                        transform: `rotate(${imageRotations[media.id] || 0}deg)` 
                      }}
                      onError={() => handleImageError(media.id)}
                    />
                  )}

                  {/* Video Preview */}
                  {isVideo && !hasError && (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onError={() => handleImageError(media.id)}
                    />
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {isImage && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRotateImage(media.id)}
                        className="h-8 w-8 p-0"
                        title="Rotate image"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    )}
                    {isImage && onEditFile && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditClick(media.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemoveFile(media.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${
                      isImage ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {isImage ? 'IMG' : 'VID'}
                    </span>
                  </div>

                  {/* File Size */}
                  <div className="absolute bottom-2 right-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-black/70 text-white">
                      {(media.file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate" title={media.file.name}>
                    {media.file.name}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Photo Editor Modal */}
      {editingFile && (
        <PhotoEditor
          isOpen={!!editingFile}
          onClose={() => setEditingFileId(null)}
          imageFile={editingFile}
          onSave={handleEditSave}
        />
      )}
    </>
  );
};

export default MediaPreviewGrid;