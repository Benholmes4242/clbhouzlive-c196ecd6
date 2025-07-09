import React, { useState, useRef, useEffect } from 'react';
import { X, Edit3, RotateCw, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PhotoEditor from './PhotoEditor';

interface MediaFile {
  file: File;
  url: string;
  id: string;
  thumbnail?: string; // For video thumbnails
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
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});

  // Generate video thumbnails
  const generateVideoThumbnail = (file: File, id: string) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.currentTime = 1; // Seek to 1 second
    video.muted = true;
    
    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const thumbnailURL = canvas.toDataURL('image/jpeg', 0.8);
        
        setVideoThumbnails(prev => ({
          ...prev,
          [id]: thumbnailURL
        }));
      }
      
      // Clean up
      URL.revokeObjectURL(video.src);
    });
  };

  // Generate thumbnails for video files
  useEffect(() => {
    mediaFiles.forEach(media => {
      if (media.file.type.startsWith('video/') && !videoThumbnails[media.id]) {
        generateVideoThumbnail(media.file, media.id);
      }
    });
  }, [mediaFiles, videoThumbnails]);

  const handleEditClick = (fileId: string) => {
    setEditingFileId(fileId);
  };

  const handleEditSave = (editedFile: File) => {
    if (editingFileId && onEditFile) {
      onEditFile(editingFileId, editedFile);
    }
    setEditingFileId(null);
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

        <div className="grid grid-cols-3 gap-2">
          {mediaFiles.map((media) => {
            const isImage = media.file.type.startsWith('image/');
            const isVideo = media.file.type.startsWith('video/');
            const videoThumbnail = videoThumbnails[media.id];

            return (
              <div key={media.id} className="relative group">
                <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                  {isImage && (
                    <img
                      src={media.url}
                      alt={`Preview of ${media.file.name}`}
                      className="w-full h-full object-cover media-thumb"
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.opacity = '1';
                      }}
                      onError={(e) => {
                        console.error('Failed to load image:', media.url);
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  )}
                  {isVideo && (
                    <div className="relative w-full h-full">
                      {videoThumbnail ? (
                        <img
                          src={videoThumbnail}
                          alt={`Video thumbnail of ${media.file.name}`}
                          className="w-full h-full object-cover media-thumb"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover media-thumb"
                          muted
                          playsInline
                        />
                      )}
                      
                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-2">
                          <Play className="h-4 w-4 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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

                  {/* Remove Button - Top Right */}
                  <button
                    onClick={() => onRemoveFile(media.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* File Name */}
                <p className="text-xs text-gray-600 truncate mt-1 px-1" title={media.file.name}>
                  {media.file.name}
                </p>
              </div>
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