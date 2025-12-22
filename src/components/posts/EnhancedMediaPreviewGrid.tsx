/**
 * EnhancedMediaPreviewGrid - Media preview grid for post creation
 * 
 * Hover previews route through MediaRuntime.
 * No direct play/pause calls.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Edit3, RotateCw, Trash2, Image as ImageIcon, Video as VideoIcon, Upload, CheckCircle, AlertCircle, GripVertical, Play, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import PhotoEditor from './PhotoEditor';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { MediaRuntime, runtimeUserTap } from '@/media/runtime';

interface MediaFile {
  file: File;
  url: string;
  id: string;
  rotation?: number;
  isLargeFile?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
  uploadUrl?: string;
  error?: string;
}

interface EnhancedMediaPreviewGridProps {
  mediaFiles: MediaFile[];
  onRemoveFile: (id: string) => void;
  onEditFile?: (id: string, editedFile: File) => void;
  onRotateFile?: (id: string, rotation: number) => void;
  onUploadFile?: (mediaFile: MediaFile) => void;
  onReorderFiles?: (reorderedFiles: MediaFile[]) => void;
  maxFiles?: number;
  className?: string;
  showUploadControls?: boolean;
}

const EnhancedMediaPreviewGrid: React.FC<EnhancedMediaPreviewGridProps> = ({
  mediaFiles,
  onRemoveFile,
  onEditFile,
  onRotateFile,
  onUploadFile,
  onReorderFiles,
  maxFiles = 10,
  className,
  showUploadControls = true
}) => {
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);
  const [draggedItem, setDraggedItem] = useState<MediaFile | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredMedia, setHoveredMedia] = useState<string | null>(null);
  const [videoDurations, setVideoDurations] = useState<Record<string, string>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Register videos with MediaRuntime for hover preview
  useEffect(() => {
    mediaFiles.forEach((media) => {
      if (media.file.type.startsWith('video/') && videoRefs.current[media.id]) {
        const video = videoRefs.current[media.id];
        if (video) {
          MediaRuntime.registerMedia({
            id: `preview-${media.id}`,
            element: video,
            surface: 'grid',
            sortIndex: 0,
          });
        }
      }
    });

    return () => {
      mediaFiles.forEach((media) => {
        if (media.file.type.startsWith('video/')) {
          MediaRuntime.unregisterMedia(`preview-${media.id}`);
        }
      });
    };
  }, [mediaFiles]);

  // Format video duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle video metadata loaded to get duration
  const handleVideoLoadedMetadata = (mediaId: string, video: HTMLVideoElement) => {
    if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      setVideoDurations(prev => ({
        ...prev,
        [mediaId]: formatDuration(video.duration)
      }));
    }
    video.currentTime = Math.min(1, video.duration * 0.1);
    handleImageLoad(mediaId);
  };

  const handleEditClick = (fileId: string) => {
    setEditingFileId(fileId);
  };

  const handleEditSave = (editedFile: File) => {
    if (editingFileId && onEditFile) {
      onEditFile(editingFileId, editedFile);
    }
    setEditingFileId(null);
  };

  const handleRotateClick = (fileId: string) => {
    const media = mediaFiles.find(m => m.id === fileId);
    if (!media || !onRotateFile) return;

    const currentRotation = media.rotation || 0;
    const newRotation = (currentRotation + 90) % 360;
    onRotateFile(fileId, newRotation);
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, media: MediaFile) => {
    setDraggedItem(media);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || !onReorderFiles) return;

    const dragIndex = mediaFiles.findIndex(item => item.id === draggedItem.id);
    if (dragIndex === -1 || dragIndex === dropIndex) return;

    const newItems = [...mediaFiles];
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, removed);

    onReorderFiles(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Hover preview handlers - route through MediaRuntime
  const handleMouseEnter = (media: MediaFile) => {
    setHoveredMedia(media.id);
    if (media.file.type.startsWith('video/')) {
      const video = videoRefs.current[media.id];
      if (video) {
        video.currentTime = 0;
        // Route hover play through MediaRuntime as user intent
        MediaRuntime.requestPlay({
          id: `preview-${media.id}`,
          surface: 'grid',
          reason: 'user',
        });
      }
    }
  };

  const handleMouseLeave = (media: MediaFile) => {
    setHoveredMedia(null);
    if (media.file.type.startsWith('video/')) {
      // Route hover pause through MediaRuntime
      MediaRuntime.requestPause({
        id: `preview-${media.id}`,
        reason: 'user',
      });
      const video = videoRefs.current[media.id];
      if (video) {
        video.currentTime = 0;
      }
    }
  };

  const handleThumbnailClick = (media: MediaFile) => {
    setPreviewMedia(media);
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
          {onReorderFiles && mediaFiles.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Drag to reorder
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mediaFiles.map((media, index) => {
            const isImage = media.file.type.startsWith('image/');
            const isVideo = media.file.type.startsWith('video/');
            const hasError = imageErrors[media.id];
            const isHovered = hoveredMedia === media.id;
            const isDraggedOver = dragOverIndex === index;

            return (
              <Card 
                key={media.id} 
                className={`relative group overflow-hidden transition-all duration-200 cursor-pointer
                  ${isDraggedOver ? 'ring-2 ring-primary scale-105' : ''}
                  ${draggedItem?.id === media.id ? 'opacity-50 scale-95' : ''}
                `}
                draggable={!!onReorderFiles}
                onDragStart={(e) => handleDragStart(e, media)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => handleMouseEnter(media)}
                onMouseLeave={() => handleMouseLeave(media)}
                onClick={() => handleThumbnailClick(media)}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div className="aspect-square relative bg-gray-100">

                  {/* Drag handle - Only show when reordering is enabled and not uploading */}
                  {onReorderFiles && mediaFiles.length > 1 && !media.isUploading && (
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/70 rounded p-1 cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}


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
                      className={`w-full h-full object-cover transition-all duration-200 ${
                        isHovered ? 'scale-110' : ''
                      }`}
                      style={{ transform: `rotate(${media.rotation || 0}deg)` }}
                      onError={() => handleImageError(media.id)}
                    />
                  )}

                  {/* Video Preview */}
                  {isVideo && !hasError && (
                    <>
                      <video
                        ref={(el) => { videoRefs.current[media.id] = el; }}
                        src={media.url}
                        className={`w-full h-full object-cover transition-all duration-200 ${
                          isHovered ? 'scale-110' : ''
                        }`}
                        style={{ transform: `rotate(${media.rotation || 0}deg)` }}
                        muted
                        preload="metadata"
                        controls={false}
                        playsInline
                        loop
                        onLoadedData={(e) => {
                          const video = e.target as HTMLVideoElement;
                          video.currentTime = 1;
                        }}
                        onError={() => handleImageError(media.id)}
                        onLoadStart={() => handleImageLoadStart(media.id)}
                        onLoadedMetadata={(e) => {
                          const video = e.target as HTMLVideoElement;
                          handleVideoLoadedMetadata(media.id, video);
                        }}
                      />
                      {/* Enhanced Video play icon overlay */}
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                        isHovered ? 'opacity-0' : 'opacity-100'
                      }`}>
                        <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                          <Play className="h-6 w-6 text-white" fill="white" />
                        </div>
                      </div>
                    </>
                  )}


                  {/* Upload Progress Overlay */}
                  {media.isUploading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                      <div className="w-3/4 space-y-2">
                        <Progress value={media.uploadProgress} className="h-2" />
                        <div className="text-center space-y-1">
                          <p className="text-sm font-medium">
                            {media.isLargeFile ? 'Uploading in chunks...' : 'Uploading...'}
                          </p>
                          <p className="text-xs text-white/80">
                            {media.uploadProgress?.toFixed(0)}%
                          </p>
                          {media.isLargeFile && (
                            <p className="text-xs text-white/60">
                              Large file - this may take a while
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Error indicator */}
                  {media.error && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-20">
                      <div className="text-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                        <p className="text-sm text-red-700 font-medium px-2">
                          {media.error}
                        </p>
                        {showUploadControls && onUploadFile && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUploadFile(media);
                            }}
                            className="mt-2 bg-white"
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Overlay Controls - Only on hover and not uploading */}
                  {!media.isUploading && !media.error && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      {isImage && onEditFile && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(media.id);
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit image"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Rotate Button for both images and videos */}
                      {onRotateFile && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotateClick(media.id);
                          }}
                          className="h-8 w-8 p-0"
                          title="Rotate media"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Enhanced Upload button */}
                  {!media.uploadUrl && !media.isUploading && !media.error && showUploadControls && onUploadFile && (
                    <div className="absolute bottom-2 left-2 z-10">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUploadFile(media);
                        }}
                        className="h-8 px-3 bg-primary hover:bg-primary/90 transition-all duration-200 group/upload"
                      >
                        <Upload className="h-3 w-3 mr-1 transition-transform group-hover/upload:translate-y-[-1px]" />
                        Upload
                      </Button>
                    </div>
                  )}

                  {/* Success indicator - small subtle green checkmark */}
                  {media.uploadUrl && !media.isUploading && (
                    <div className="absolute top-2 right-2 z-10 animate-fade-in">
                      <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center">
                        <CheckCircle className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  )}

                </div>

                <div className="p-2 flex items-center justify-between">
                  <p className="text-xs text-gray-600 truncate flex-1" title={media.file.name}>
                    {media.file.name.split('.')[0]}.{media.file.name.split('.').pop()}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* File size */}
                    {!isVideo || !videoDurations[media.id] ? (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {(media.file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {videoDurations[media.id]}
                      </span>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(media.id);
                      }}
                      className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from post"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Photo Editor Modal */}
      {editingFile && (
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFileId(null)}>
          <DialogContent className="max-w-4xl p-0">
            <DialogTitle className="sr-only">Edit Photo</DialogTitle>
            <VisuallyHidden>
              <p>Edit and crop your photo</p>
            </VisuallyHidden>
            <PhotoEditor
              image={editingFile}
              onSave={handleEditSave}
              onCancel={() => setEditingFileId(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
          <DialogContent className="max-w-4xl p-4">
            <DialogTitle className="sr-only">Media Preview</DialogTitle>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {previewMedia.file.type.startsWith('image/') ? (
                <img
                  src={previewMedia.url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={{ transform: `rotate(${previewMedia.rotation || 0}deg)` }}
                />
              ) : (
                <video
                  src={previewMedia.url}
                  className="w-full h-full object-contain"
                  style={{ transform: `rotate(${previewMedia.rotation || 0}deg)` }}
                  controls
                  autoPlay
                  loop
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default EnhancedMediaPreviewGrid;
